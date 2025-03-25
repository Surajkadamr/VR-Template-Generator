# VR Template Generator with Lab Experiments

This application combines a Next.js frontend with a Python Flask backend to generate VR learning templates with lab experiment visualizations.

## Setup Instructions

### 1. Python Backend Setup

1. Navigate to the backend directory:
   ```
   cd backend
   ```

2. Create a virtual environment:
   ```
   python -m venv venv
   ```

3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - macOS/Linux: `source venv/bin/activate`

4. Install dependencies:
   ```
   pip install flask flask-cors python-dotenv google-generativeai pillow
   ```

5. Create a `.env` file in the backend directory with your Google API key:
   ```
   GOOGLE_API_KEY=your_api_key_here
   ```

6. Start the Flask server:
   ```
   python app.py
   ```
   The server will run on http://localhost:5000 by default.

### 2. Next.js Frontend Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Create or update the `.env.local` file with the following values:
   ```
   PYTHON_API_URL=http://localhost:5000
   NEXTAUTH_URL=http://localhost:3000
   ```

3. Start the development server:
   ```
   npm run dev
   ```
   The Next.js app will run on http://localhost:3000 by default.

## Testing the Connection

1. Start both the Python Flask backend and the Next.js frontend.
2. Visit http://localhost:3000/api/test-connection in your browser to verify the connection between the two services.

## Usage

1. Upload a PDF textbook chapter using the application interface.
2. The system will analyze the content and extract relevant information.
3. Lab experiment content will be sent to the Python backend, which will:
   - Generate a prompt for an appropriate lab experiment visualization
   - Create an image based on the generated prompt
4. The image will be returned to the Next.js backend and included in the generated document.
5. Download the Word document containing the VR template with embedded lab experiment visualization.

## API Endpoints

### Next.js Backend
- `/api/process-pdf` - Processes a PDF and extracts content
- `/api/lab-image` - Sends lab experiment content to the Python backend
- `/api/generate-from-template` - Generates a Word document
- `/api/generate-docx` - Alternative Word document generation 
- `/api/test-connection` - Tests connection to the Python backend

### Python Backend
- `/api/generate-lab-prompt` - Generates a prompt for lab experiment visualization
- `/api/generate-lab-image` - Generates an image based on the prompt
- `/api/health` - Health check endpoint
