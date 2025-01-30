"""Azure AI client initialization module for drug discovery platform.

This module demonstrates the integration of three key Azure AI SDKs:

1. azure-ai-projects SDK:
   - Creates and manages AI projects for drug analysis
   - Configures AI agents with specialized tools for molecular analysis
   - Manages deployment of models and resources

2. azure-ai-inference SDK:
   - Handles chat completions for drug property predictions
   - Processes molecular structure analysis
   - Manages model inference for drug candidate evaluation

3. Tools Configuration:
   - BingGroundingTool: Searches scientific literature and research papers
   - FunctionTool: Executes custom drug analysis functions
   - CodeInterpreterTool: Processes clinical trial data

Workshop Learning Objectives:
- Understanding Azure AI project setup and configuration
- Working with AI agents for drug discovery
- Implementing scientific literature search
- Managing model deployments for molecular analysis
"""
import os
import logging
import asyncio
from azure.ai.projects import AIProjectClient
from azure.ai.projects.models import BingGroundingTool, ToolSet, FunctionTool, CodeInterpreterTool
from azure.ai.inference import ChatCompletionsClient
from azure.identity import DefaultAzureCredential
from azure.core.exceptions import ResourceNotFoundError
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.http.trace_exporter import OTLPSpanExporter

# Configure logging
logger = logging.getLogger(__name__)

# Initialize OpenTelemetry
trace.set_tracer_provider(TracerProvider())
tracer = trace.get_tracer(__name__)

# Initialize Azure AI clients
project_client = None
chat_client = None
toolset = None

async def init_clients():
    """Initialize mock clients for local development."""
    global project_client, chat_client, toolset
    logger.info("🔧 Using mock clients for local development")
    
    try:
        # Check required environment variables
        deployment_name = os.getenv('spn_4o_model')
        if not deployment_name:
            raise ValueError("Model deployment name (spn_4o_model) not found")

        project_endpoint = os.getenv("spn_4o_azure_endpoint")
        if not project_endpoint:
            raise ValueError("Azure AI Project endpoint (spn_4o_azure_endpoint) not found")

        subscription_id = os.getenv("spn_4o_AZURE_SUBSCRIPTION_ID")
        if not subscription_id:
            raise ValueError("Azure subscription ID (spn_4o_AZURE_SUBSCRIPTION_ID) not found")

        resource_group = os.getenv("spn_4o_AZURE_RESOURCE_GROUP")
        if not resource_group:
            raise ValueError("Azure resource group (spn_4o_AZURE_RESOURCE_GROUP) not found")

        project_name = os.getenv("spn_4o_AZURE_PROJECT_NAME")
        if not project_name:
            raise ValueError("Azure project name (spn_4o_AZURE_PROJECT_NAME) not found")

        # Initialize Azure credentials
        credential = DefaultAzureCredential()

        # Initialize project client
        project_client = AIProjectClient(
            endpoint=project_endpoint,
            credential=credential,
            subscription_id=subscription_id,
            resource_group_name=resource_group,
            project_name=project_name,
            headers={
                "x-ms-enable-preview": "true",
                "api-version": os.getenv("spn_4o_api_version", "2024-02-15-preview")
            }
        )
        
        # Initialize chat client
        chat_client = ChatCompletionsClient(
            endpoint=project_endpoint,
            credential=credential,
            headers={
                "x-ms-enable-preview": "true",
                "api-version": os.getenv("spn_4o_api_version", "2024-02-15-preview")
            }
        )
        
        # Initialize toolset with Bing grounding
        bing_api_key = os.getenv("spn_4o_BING_API_KEY")
        if not bing_api_key:
            raise ValueError("Bing API key not found in environment variables")

        toolset = ToolSet()
        bing_tool = BingGroundingTool(
            connection_id=bing_api_key
        )
        toolset.add(bing_tool)
        
        # Test clients by creating a simple agent
        test_agent = await project_client.agents.create_agent(
            model=deployment_name,
            instructions="Test agent for connection verification.",
            toolset=toolset,
            headers={"x-ms-enable-preview": "true"}
        )
        
        # Log successful initialization
        logger.info(f"""✨ Successfully initialized Azure AI clients:
        Endpoint: {project_endpoint}
        Model Deployment: {deployment_name}
        API Version: {os.getenv("spn_4o_api_version", "2024-02-15-preview")}
        Test Agent ID: {test_agent.id}
        Tools: {[type(tool).__name__ for tool in toolset._tools]}""")
        
        return project_client, chat_client, toolset
        
    except Exception as e:
        logger.error(f"❌ Error initializing Azure AI Foundry clients: {str(e)}")
        raise

async def ensure_clients():
    """Ensure clients are initialized."""
    global project_client, chat_client, toolset
    if project_client is None or chat_client is None:
        project_client, chat_client, toolset = await init_clients()

__all__ = ['project_client', 'chat_client', 'toolset', 'tracer', 'ensure_clients']
