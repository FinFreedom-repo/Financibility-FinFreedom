from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import logging
import pandas as pd
import os
from dotenv import load_dotenv
from openai import OpenAI
import io

logger = logging.getLogger(__name__)
load_dotenv()

class ExpenseAnalyzerView(APIView):
    parser_classes = (MultiPartParser,)
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("=== ExpenseAnalyzerView.post() called ===")
        logger.info("=== Starting Expense Analysis ===")
        logger.info(f"Request headers: {request.headers}")
        logger.info(f"Request user: {request.user}")
        logger.info(f"Request auth: {request.auth}")
        
        try:
            # Get the file from the request
            file = request.FILES.get('file')
            if not file:
                logger.error("No file provided in request")
                return Response(
                    {'error': 'No file provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            logger.info(f"Received file: {file.name}, size: {file.size} bytes")
            logger.info(f"File content type: {file.content_type}")

            # Read and process the file based on its type
            try:
                file_content = ""
                file_extension = os.path.splitext(file.name)[1].lower()

                if file_extension == '.csv':
                    # Read CSV file
                    df = pd.read_csv(file)
                    logger.info(f"CSV file read successfully. Shape: {df.shape}")
                    logger.info(f"Columns: {df.columns.tolist()}")
                    file_content = df.to_string()
                elif file_extension == '.xlsx' or file_extension == '.xls':
                    # Read Excel file
                    df = pd.read_excel(file)
                    logger.info(f"Excel file read successfully. Shape: {df.shape}")
                    logger.info(f"Columns: {df.columns.tolist()}")
                    file_content = df.to_string()
                else:
                    # For other file types, try to read as text
                    try:
                        # Try to decode as UTF-8
                        content = file.read().decode('utf-8')
                        file_content = content
                        logger.info("File read as text successfully")
                    except UnicodeDecodeError:
                        # If UTF-8 fails, try to read as bytes and convert to string
                        content = str(file.read())
                        file_content = content
                        logger.info("File read as bytes successfully")

            except Exception as e:
                logger.error(f"Error reading file: {str(e)}")
                return Response(
                    {'error': 'Error processing file'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Initialize the OpenAI client with xAI's API endpoint
            api_key = os.getenv("GROK_API_KEY")
            if not api_key:
                logger.error("GROK_API_KEY not found in environment variables")
                return Response(
                    {'error': 'API key not configured'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            logger.info("Initializing OpenAI client...")
            client = OpenAI(
                api_key=api_key,
                base_url="https://api.x.ai/v1",
            )

            # Create a prompt for Grok to analyze the expense data
            prompt = f"""Please analyze this financial data and provide insights:
            1. What are the main categories of expenses or transactions?
            2. What are the largest expenses or transactions?
            3. Are there any unusual or unexpected items?
            4. What patterns do you notice in the data?
            5. What recommendations would you make based on this data?

            Here's the data:
            {file_content}"""

            # Make a request to the Grok API
            logger.info("Making request to Grok API...")
            completion = client.chat.completions.create(
                model="grok-3-mini",
                messages=[
                    {"role": "system", "content": "You are Grok, a helpful AI assistant specializing in financial analysis."},
                    {"role": "user", "content": prompt},
                ],
            )
            logger.info("Received response from Grok API")

            # Get the response content
            grok_response = completion.choices[0].message.content
            logger.info(f"Grok response length: {len(grok_response)} characters")
            logger.info(f"Grok response: {grok_response}")

            # Return the analysis
            return Response({
                'message': 'Document analyzed successfully',
                'filename': file.name,
                'analysis': grok_response
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error processing request: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 