from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, JSONParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
import logging
import pandas as pd
import os
from dotenv import load_dotenv
from openai import OpenAI
import io
import json

logger = logging.getLogger(__name__)
load_dotenv()

class ExpenseAnalyzerView(APIView):
    parser_classes = (MultiPartParser,)
    permission_classes = [IsAuthenticated]

    def post(self, request):
        print("\n=== ExpenseAnalyzerView.post() called ===")
        print(f"Request method: {request.method}")
        print(f"Request content type: {request.content_type}")
        print(f"Request headers: {dict(request.headers)}")
        print(f"Request user: {request.user}")
        print(f"Request auth: {request.auth}")
        print(f"Request FILES: {request.FILES}")
        print(f"Request data: {request.data}")
        
        logger.info("=== Starting Expense Analysis ===")
        logger.info(f"Request headers: {request.headers}")
        logger.info(f"Request user: {request.user}")
        logger.info(f"Request auth: {request.auth}")
        
        try:
            # Get the file from the request
            file = request.FILES.get('file')
            if not file:
                print("No file found in request.FILES")
                logger.error("No file provided in request")
                return Response(
                    {'error': 'No file provided'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            print(f"File details - Name: {file.name}, Size: {file.size}, Content-Type: {file.content_type}")
            logger.info(f"Received file: {file.name}, size: {file.size} bytes")
            logger.info(f"File content type: {file.content_type}")

            # Read and process the file based on its type
            try:
                file_content = ""
                file_extension = os.path.splitext(file.name)[1].lower()
                print(f"File extension: {file_extension}")

                if file_extension == '.csv':
                    print("Processing CSV file")
                    # Read CSV file
                    df = pd.read_csv(file)
                    print(f"CSV file read successfully. Shape: {df.shape}")
                    print(f"Columns: {df.columns.tolist()}")
                    logger.info(f"CSV file read successfully. Shape: {df.shape}")
                    logger.info(f"Columns: {df.columns.tolist()}")
                    file_content = df.to_string()
                elif file_extension == '.xlsx' or file_extension == '.xls':
                    print("Processing Excel file")
                    # Read Excel file
                    df = pd.read_excel(file)
                    print(f"Excel file read successfully. Shape: {df.shape}")
                    print(f"Columns: {df.columns.tolist()}")
                    logger.info(f"Excel file read successfully. Shape: {df.shape}")
                    logger.info(f"Columns: {df.columns.tolist()}")
                    file_content = df.to_string()
                else:
                    print("Processing as text file")
                    # For other file types, try to read as text
                    try:
                        # Try to decode as UTF-8
                        content = file.read().decode('utf-8')
                        file_content = content
                        print("File read as text successfully")
                        logger.info("File read as text successfully")
                    except UnicodeDecodeError:
                        print("UTF-8 decode failed, trying to read as bytes")
                        # If UTF-8 fails, try to read as bytes and convert to string
                        content = str(file.read())
                        file_content = content
                        print("File read as bytes successfully")
                        logger.info("File read as bytes successfully")

            except Exception as e:
                print(f"Error reading file: {str(e)}")
                logger.error(f"Error reading file: {str(e)}")
                return Response(
                    {'error': f'Error processing file: {str(e)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Initialize the OpenAI client with xAI's API endpoint
            api_key = os.getenv("GROK_API_KEY")
            if not api_key:
                print("GROK_API_KEY not found in environment variables")
                logger.error("GROK_API_KEY not found in environment variables")
                return Response(
                    {'error': 'API key not configured'}, 
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )
            
            print("Initializing OpenAI client...")
            logger.info("Initializing OpenAI client...")
            client = OpenAI(
                api_key=api_key,
                base_url="https://api.x.ai/v1",
            )

            # Create a prompt for Grok to analyze the expense data
            prompt = f"""Please categorize all expenses in this data into the following categories:
            - Housing (rent, mortgage, utilities)
            - Transportation (gas, car payments, public transit)
            - Food (groceries, restaurants)
            - Healthcare (medical bills, insurance, prescriptions)
            - Entertainment (movies, games, hobbies)
            - Shopping (clothing, electronics, household items)
            - Travel (vacations, business trips)
            - Education (tuition, books, courses)
            - Personal Care (grooming, wellness)
            - Other (any expenses that don't fit above categories)

            For each category, sum up the total expenses and just print out the total for each category. and can you put it in JSON format?

            Here's the data:
            {file_content}"""

            # Make a request to the Grok API
            print("Making request to Grok API...")
            logger.info("Making request to Grok API...")
            completion = client.chat.completions.create(
                model="grok-3-mini",
                messages=[
                    {"role": "system", "content": "You are Grok, a helpful AI assistant specializing in financial analysis."},
                    {"role": "user", "content": prompt},
                ],
            )
            print("Received response from Grok API")
            logger.info("Received response from Grok API")

            # Get the response content
            grok_response = completion.choices[0].message.content
            print(f"Grok response length: {len(grok_response)} characters")
            print(f"Grok response: {grok_response}")
            logger.info(f"Grok response length: {len(grok_response)} characters")
            logger.info(f"Grok response: {grok_response}")

            # Return the analysis
            return Response({
                'message': 'Document analyzed successfully',
                'filename': file.name,
                'analysis': grok_response
            }, status=status.HTTP_200_OK)

        except Exception as e:
            print(f"Error processing request: {str(e)}")
            logger.error(f"Error processing request: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

class ExpenseChatView(APIView):
    parser_classes = (JSONParser,)
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            message = request.data.get('message')
            analysis = request.data.get('analysis')

            if not message or not analysis:
                return Response(
                    {'error': 'Message and analysis data are required'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Initialize the OpenAI client
            api_key = os.getenv("GROK_API_KEY")
            if not api_key:
                return Response(
                    {'error': 'API key not configured'},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR
                )

            client = OpenAI(
                api_key=api_key,
                base_url="https://api.x.ai/v1",
            )

            # Create a prompt for the chat
            prompt = f"""Based on this expense analysis data:
            {analysis}

            Please answer this question: {message}

            Provide a clear, concise answer focusing on the specific question asked."""

            # Make a request to the Grok API
            completion = client.chat.completions.create(
                model="grok-3-mini",
                messages=[
                    {"role": "system", "content": "You are Grok, a helpful AI assistant specializing in financial analysis."},
                    {"role": "user", "content": prompt},
                ],
            )

            response = completion.choices[0].message.content

            return Response({
                'response': response
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.error(f"Error in chat: {str(e)}", exc_info=True)
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            ) 