# Long-Term Memory Assistant

> **Phase 1 — Basic AI Chat Foundation & Amazon Bedrock Integration**

A modern full-stack web application establishing the clean, scalable foundation for an intelligent personal AI assistant powered by **Amazon Bedrock**.

Phase 1 focuses exclusively on delivering a robust, secure, and responsive chat architecture without persistent memory. In subsequent phases, this foundation will be augmented with long-term vector memory (Amazon OpenSearch) and knowledge graph memory (Amazon Neptune).

---

## 1. Architecture Overview

### Communication Flow

```
┌────────────────────────────────┐
│      React Frontend (Vite)     │  (Port 5173)
└───────────────┬────────────────┘
                │  POST /api/chat {"message": "..."}
                ▼
┌────────────────────────────────┐
│     Node.js / Express API      │  (Port 5000)
│   (Input Validation & CORS)    │
└───────────────┬────────────────┘
                │  ConverseCommand via generateReply()
                ▼
┌────────────────────────────────┐
│   Dedicated Bedrock Service    │  backend/src/services/bedrock.ts
└───────────────┬────────────────┘
                │  Converse API (SigV4 Auth)
                ▼
┌────────────────────────────────┐
│         Amazon Bedrock         │  (Claude 3.5 / Nova / Llama)
└───────────────┬────────────────┘
                │  AI Model Response
                ▼
┌────────────────────────────────┐
│     Node.js / Express API      │
└───────────────┬────────────────┘
                │  JSON {"reply": "...", "message": "..."}
                ▼
┌────────────────────────────────┐
│      React Frontend (Vite)     │  (Renders Assistant Bubble)
└────────────────────────────────┘
```

> **Security Guardrail:** The browser **never** calls Amazon Bedrock directly and **never** holds AWS credentials. All Bedrock invocations are managed securely by the backend via the AWS SDK standard credential provider chain.

---

## 2. Monorepo Directory Structure

```
long-term-memory-assistant/
│
├── frontend/                               # React + Vite + TypeScript Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx                 # App header with phase badge & health status
│   │   │   ├── ChatWindow.tsx             # Message history, empty state & thinking state
│   │   │   ├── MessageBubble.tsx          # Distinct styling for User vs Assistant
│   │   │   └── ChatInput.tsx              # Autogrowing input, keyboard shortcuts
│   │   ├── types/
│   │   │   └── chat.ts                    # Frontend chat TypeScript definitions
│   │   ├── vite-env.d.ts                  # Vite client & environment types
│   │   ├── App.tsx                        # Main state orchestrator & chat handler
│   │   ├── main.tsx                       # React DOM entry point
│   │   └── index.css                      # Tailwind styling & sleek dark scrollbars
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts                     # Vite config with API reverse proxy
│
├── backend/                                # Node.js + Express + TypeScript Backend
│   ├── src/
│   │   ├── config.ts                      # Centralized environment loader (dotenv first)
│   │   ├── routes/
│   │   │   └── chat.ts                    # POST /api/chat, GET /api/health, GET /api/health/bedrock
│   │   ├── services/
│   │   │   └── bedrock.ts                 # Dedicated Amazon Bedrock service (Converse API)
│   │   ├── types/
│   │   │   └── chat.ts                    # Backend request/response types
│   │   ├── app.ts                         # Express application setup & middleware
│   │   └── server.ts                      # Server listener entry point
│   ├── tests/
│   │   └── chat.test.ts                   # Automated Jest & Supertest suites (mocked AWS)
│   ├── .env.example                       # Environment template with placeholders
│   ├── .env                               # Local environment configuration (gitignored)
│   ├── jest.config.js
│   ├── package.json
│   └── tsconfig.json
│
├── design.md                              # Product UI & visual design specification
├── README.md                              # Setup, AWS configuration & architecture documentation
└── .gitignore                             # Secret & artifact exclusion rules
```

---

## 3. Prerequisites & Dependencies

1. **Node.js**: `v18.x` or higher (verified on `v20+` / `v22+`).
2. **npm**: `v9.x` or higher.
3. **AWS CLI v2**: Installed on your development machine.
4. **AWS Account**: With an active IAM user and Model Access in Amazon Bedrock.

### Backend Dependencies
The backend communicates with Bedrock using the official AWS SDK v3:
* `@aws-sdk/client-bedrock-runtime`: For the unified Converse API (`ConverseCommand`).
* `express`: Server framework.
* `cors`: Cross-Origin Resource Sharing.
* `dotenv`: Environment configuration.

---

## 4. AWS Setup & Minimum IAM Permissions

### Step 1: Request Model Access in AWS Bedrock Console
Amazon Bedrock models are locked by default until requested:
1. Log in to the [AWS Bedrock Console](https://console.aws.amazon.com/bedrock/home#/modelaccess).
2. Select your target region in the top-right corner (e.g. `us-east-1` or `ap-south-1`).
3. Click **Model access** in the left navigation sidebar.
4. Click **Enable specific models** (or **Modify model access**).
5. Check the box for your desired model (e.g., **Amazon Nova Micro** or **Anthropic Claude 3.5 Haiku**).
6. Click **Next** and **Submit**.

> [!IMPORTANT]
> If you see `ValidationException: Operation not allowed` when calling Bedrock, it indicates that Model Access has not been granted yet for that model in your selected region.

### Step 2: Minimum Required IAM Policy
Follow the principle of least privilege. Do **not** use root access keys or grant administrator privileges. Attach this minimum policy to your IAM user:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "BedrockInvokeModelOnly",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/*",
        "arn:aws:bedrock:*:*:inference-profile/*"
      ]
    }
  ]
}
```

### Step 3: Configure Local AWS Credentials
Configure your IAM user credentials on your local machine using the AWS CLI:

```bash
aws configure
```
Enter your details:
* `AWS Access Key ID`: `AKIA...` (from IAM user security credentials)
* `AWS Secret Access Key`: `...` (secret key)
* `Default region name`: `us-east-1` (or your chosen region)
* `Default output format`: `json`

### Step 4: Verify Your AWS Identity
Confirm your active credentials by running:

```bash
aws sts get-caller-identity
```
You should see your IAM user ARN (e.g., `arn:aws:iam::123456789012:user/your-user`).

---

## 5. Environment Variables Configuration

In `backend/`, copy `.env.example` to `.env`:

```bash
cd backend
cp .env.example .env
```

| Variable | Description | Example / Default |
|---|---|---|
| `PORT` | Local port where Express server listens | `5000` |
| `FRONTEND_URL` | Allowed origin for frontend requests | `http://localhost:5173` |
| `AWS_REGION` | AWS region hosting the Bedrock model | `us-east-1` |
| `BEDROCK_MODEL_ID` | Model identifier supporting Converse API | `amazon.nova-micro-v1:0` |
| `BEDROCK_MAX_TOKENS` | Max tokens generated per reply | `2048` |

> [!WARNING]
> Never put `AWS_ACCESS_KEY_ID` or `AWS_SECRET_ACCESS_KEY` in `.env` files or frontend code. The AWS SDK automatically resolves credentials using the standard credential chain.

---

## 6. Running the Application Locally

### 1. Start the Backend Server

```bash
cd backend
npm install
npm run dev
```

The backend server starts on `http://localhost:5000`:
* General health: `GET http://localhost:5000/api/health`
* Bedrock configuration check: `GET http://localhost:5000/api/health/bedrock`
* Live Bedrock invocation test: `GET http://localhost:5000/api/health/bedrock?test=true`
* Chat API: `POST http://localhost:5000/api/chat`

### 2. Start the Frontend Client

In a separate terminal window:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 7. Testing the Integration

### A. Testing the Backend Independently

You can verify the backend directly without the browser using PowerShell or curl:

**1. Verify Bedrock Configuration:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health/bedrock" -Method GET
```
Expected output:
```json
{
  "status": "configured",
  "region": "us-east-1",
  "modelId": "amazon.nova-micro-v1:0",
  "message": "Amazon Bedrock configuration is present..."
}
```

**2. Test Live Bedrock Invocation:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/health/bedrock?test=true" -Method GET
```
*(Note: Active invocation tests may incur minor Bedrock usage charges).*

**3. Send a Chat Message:**
```powershell
$body = @{ message = "Explain artificial intelligence in simple terms." } | ConvertTo-Json
Invoke-RestMethod -Uri "http://localhost:5000/api/chat" -Method POST -Headers @{ "Content-Type" = "application/json" } -Body $body
```
Expected response:
```json
{
  "reply": "Artificial intelligence is...",
  "message": "Artificial intelligence is..."
}
```

### B. Testing Through the Website

1. Navigate to `http://localhost:5173` in your browser.
2. Verify the status badge in the header shows **"Connected"**.
3. Type a message in the input box (e.g., *"Hello! What can you help me with?"*) and press Enter.
4. You will see:
   * The user message appears immediately in a purple chat bubble on the right.
   * The thinking indicator animation appears while waiting for Bedrock.
   * The AI-generated response from Amazon Bedrock appears in a dark slate bubble on the left.

---

## 8. Common Errors & Troubleshooting

| Error / Code | Root Cause | Solution |
|---|---|---|
| `MODEL_ACCESS_REQUIRED`<br>`ValidationException: Operation not allowed` | Model access has not been enabled in the AWS Bedrock Console. | Open the [Bedrock Model Access Console](https://console.aws.amazon.com/bedrock/home#/modelaccess), select the matching region (`AWS_REGION`), and enable the model. |
| `MODEL_END_OF_LIFE`<br>`ResourceNotFoundException: This model version has reached the end of its life` | The specified model version is deprecated or retired. | Update `BEDROCK_MODEL_ID` in `backend/.env` to an active model (e.g. `amazon.nova-micro-v1:0`). |
| `MODEL_NOT_FOUND`<br>`ResourceNotFoundException` | The model does not exist in the configured `AWS_REGION`. | Verify the model availability in your region using `aws bedrock list-foundation-models --region <region>`. |
| `ACCESS_DENIED`<br>`AccessDeniedException` | IAM user does not have permission to invoke Bedrock models. | Attach a policy with `bedrock:InvokeModel` to your IAM user. |
| `CREDENTIALS_MISSING`<br>`CredentialsProviderError` | AWS SDK cannot find credentials on the machine. | Run `aws configure` in your terminal and verify with `aws sts get-caller-identity`. |
| `CONFIGURATION_ERROR` | `AWS_REGION` or `BEDROCK_MODEL_ID` is missing from `backend/.env`. | Check `backend/.env` and ensure both variables are defined. |
| `THROTTLED`<br>`ThrottlingException` | Account exceeded Bedrock rate limits. | Wait a few seconds before sending the next message, or request a quota increase in AWS Service Quotas. |

---

## 9. Running Automated Tests

The test suite runs with Jest and Supertest. All AWS Bedrock calls are mocked, so tests run completely offline and never require AWS credentials or incur charges:

```bash
cd backend
npm test
```

### Verified Test Suites:
* `GET /api/health` returns `200 OK`.
* `GET /api/health/bedrock` returns configuration details without calling the model.
* `GET /api/health/bedrock?test=true` executes model invocation test and handles responses.
* `POST /api/chat` validates input: rejects empty messages, whitespace, and oversized messages (>10,000 characters) with `400 Bad Request`.
* `POST /api/chat` handles both single message string and conversation history payload.
* `POST /api/chat` returns formatted `{ reply, message }` responses.
* `POST /api/chat` safely handles AWS errors (`ValidationException`, `AccessDeniedException`, etc.) without exposing stack traces or AWS credentials.
