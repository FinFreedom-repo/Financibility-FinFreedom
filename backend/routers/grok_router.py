from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser
import pandas as pd
import os
from dotenv import load_dotenv
import logging
from openai import OpenAI

logger = logging.getLogger(__name__)
load_dotenv()

class GrokExcelView(APIView):
    parser_classes = (MultiPartParser,)

    def post(self, request):
        try:
            # Get the Excel file from the request
            excel_file = request.FILES.get('file')
            if not excel_file:
                return Response(
                    {'error': 'No file provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Read the entire Excel file
            df = pd.read_excel(excel_file)
            
            # Get the first row for the response
            first_row = df.iloc[0].to_dict()
            
            # Convert the entire DataFrame to a string format for Grok
            excel_content = df.to_string()
            prompt = "Can you tell me what the first line in this document is?\n\n" + excel_content

            # Initialize the OpenAI client with xAI's API endpoint
            client = OpenAI(
                api_key=os.getenv("XAI_API_KEY"),
                base_url="https://api.x.ai/v1",
            )

            # Make a request to the Grok API
            completion = client.chat.completions.create(
                model="grok-beta",
                messages=[
                    {"role": "system", "content": "You are Grok, a helpful AI assistant."},
                    {"role": "user", "content": prompt},
                ],
            )

            # Get the response content
            grok_response = completion.choices[0].message.content

            return Response({
                'analysis': grok_response,
                'line_item': first_row
            })

        except Exception as e:
            logger.error(f"Error processing request: {str(e)}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 