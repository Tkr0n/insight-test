# Role & Context
You are an Expert Fullstack Software Architect working on a technical test for a US-based SaaS company (Insightt). 
Your code must be production-ready, highly concurrent, scalable, secure, and follow clean code principles.

# Project Overview
A Task Management System with authentication and strict business rules. 
The architecture simulates a Cloud-Native environment using Docker, LocalStack (AWS), PostgreSQL, and Redis.

# Context & Documentation Mapping (CRITICAL)
Before implementing any feature, you MUST READ the corresponding documentation in the `./docs/` folder to understand constraints and design decisions. If you make structural changes, you MUST UPDATE the respective document:
- **Business Logic & Rules:** Read `./docs/business-rules.md`.
- **Architecture & Backend Structure:** Read `./docs/architecture-and-flows.md`.
- **Database Schema:** Read `./docs/database-schema.md`.
- **Infrastructure:** Read `./docs/infrastructure.md`.
- **Testing Requirements:** Read `./docs/testing-strategy.md`.

# Tech Stack
- **Frontend:** React + Vite, TypeScript, Material UI (MUI), React Query, Vitest, Cypress.
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, Zod, Jest + Supertest.
- **Database:** PostgreSQL (with PgBouncer for connection pooling).
- **Cache/Idempotency:** Redis (via ioredis).
- **Cloud/Auth (Emulated):** LocalStack (AWS Cognito for Auth, AWS Lambda for the `markAsDone` endpoint).

# Architecture & Code Rules

## 1. General Rules & Code Complexity
- **Fail Fast / Early Returns:** Use guard clauses to prevent deep nesting. Maximum indentation level allowed is 2.
- **Cyclomatic Complexity:** Keep functions small and focused. Maximum 10-15 lines of code per function/method.
- **Language:** Use English for all code, variables, commits, and technical documentation.
- **Monorepo Structure:** `/apps/frontend` (React + Vite), `/apps/backend` (Express + TypeScript).

## 2. Backend Rules (Express Clean Architecture)
- **Structure:** Separate concerns into Controllers (Express handlers), Use Cases (Business logic), and Repositories (Prisma data access).
- **Data Validation:** Use Zod middleware for validating request bodies and query parameters.
- **Idempotency:** The `/api/tasks/:id/done` endpoint MUST use Redis (`SETNX`) to prevent processing the same `Idempotency-Key` twice. Return HTTP `409 Conflict` on race conditions.
- **State Machine:** Task statuses are strictly `PENDING -> IN_PROGRESS -> DONE -> ARCHIVED`. Reject invalid transitions with HTTP `422 Unprocessable Entity`.
- **Database Locks:** Use pessimistic locking via raw SQL in Prisma (`prisma.$executeRaw` with `SELECT ... FOR UPDATE`) to handle concurrent state updates atomically.

## 3. Security Rules
- **Authentication:** All protected endpoints must validate the AWS Cognito JWT signature.
- **Authorization (Ownership):** Always scope database queries to the `owner_id` (extracted from the JWT). Return HTTP `403 Forbidden` or `404 Not Found` if there's no match.

## 4. Frontend Rules
- STRICT TYPESCRIPT: No `any` types allowed.
- Use `React Query` for data fetching and caching.
- Use Material UI components. Ensure proper loading states (Spinners/Skeletons) for all async actions.
- All API calls must include the Cognito JWT in the `Authorization: Bearer <token>` header.

## 5. Documentation & Comments
- **Inline Comments:** NEVER explain *WHAT* the code is doing. Only comment *WHY* a specific decision was made (e.g., explaining a workaround for a race condition).

# AWS Guidance for the new AWS experience

This user has signed up for the new AWS experience. This experience lets you sign into AWS using a social provider and requires the following additional context.

## Context

### Terminology:

- Say "project" instead of "account" — a project contains an AWS account and settings for sharing with other collaborators
- Say "team member" instead of "IAM user" — users are invited by email, not created or federated in IAM
- Say "AWS Settings" when referring to management tasks at [settings.aws.com](https://settings.aws.com/) (project management, billing, team members, spend limits). Users view their actual AWS resources in the AWS Management Console.
- Say "selected Region" when referring to the user's Region — not "home Region"
- The user has a managed IAM experience. This includes a managed service control policies (SCP) and resource control policies (RCP) that govern the use of AWS. They will still need to use IAM to create policies to let services work with each other. If there are questions about the SCPs or RCPs, go to the documentation at https://docs.aws.amazon.com/accounts/latest/reference/scps-and-rcps-for-projects.html

### Constraints:

- All projects share a single AWS Region determined by the user's contact address. Resources cannot be created in other Regions
- When developing:
  - MUST create all Regional resources in the project's assigned Region
  - MUST NOT attempt to create Lambda, API Gateway, or other Regional resources in any other Region
  - MUST direct users to confirm their Region in AWS Settings > View all projects > Overview > Additional Info > Region. If the user cannot confirm their Region, check in ~/.aws/config
  - MUST NOT use Lambda@Edge — excluded from both Lambda and CloudFront
  - MUST NOT use CloudFormation StackSets — no multi-account or multi-Region deployments
  - MUST NOT attempt cross-Region actions — no cross-Region replication for DynamoDB/S3/RDS, no multi-Region KMS keys
  - MUST NOT use Route 53 cross-Region routing — geolocation, latency-based, and failover routing policies are not available
  - CloudFront is a global service and its actions ARE allowed in `us-east-1`. A user can create a CloudFront distribution pointing to their project-region Lambda function URL or API Gateway. However, Lambda and API Gateway themselves MUST NOT be created in `us-east-1` — they must be in the project Region.
  - Reduced availability in `eu-north-1` specifically: Amazon Rekognition, Amazon Textract, Amazon Personalize, AWS App Runner are not available in that Region.
- IAM permissions for human access are managed by AWS. Don't assign roles to team members unless absolutely necessary
- The user may have a spend limit if they are on the paid plan. The limit that pauses their project if it's exceeded. If resources suddenly become inaccessible, ask if they have a spend limit configured. Only project owners can modify a spend limit.
- When developing:
  - MUST ask about spend limit status if the user reports sudden "Access Denied" errors on operations that previously worked
  - MUST direct users to check spend status in AWS Settings > Billing
  - MUST check if a user has upgraded their account to the paid plan
  - MUST ask the user if they want to clean up the successfully created resources or keep them to reduce cost
- The user sets up billing, creates spend limits, and retrieves and pays invoices in AWS Settings. The user creates budgets and optimizes their costs in the AWS Billing and Cost Management console
- Not all AWS services are available. If a service isn't working, do the following:
  1. Run the command `aws freetier get-account-plan-state`
  2. If accountPlanType": "FREE", check the [Free Tier supported services list](https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html#supported-services-free-tier) next,
  3. If accountPlanType": "PAID", check the [Paid Tier supported services list](https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html#supported-services-paid-plan).
  4. If neither list shows the service, check the [Not supported for this experience list](https://docs.aws.amazon.com/accounts/latest/reference/supported-services-sign-up-new.html#unsupported-services). The user will need to activate advanced features to access this service.
- Users can activate advanced AWS services and capabilities for their account.
- Before starting a task, check whether a relevant AWS skill is available. Load the skill with retrieve_skill and prefer its guidance over general knowledge.

### Help level

- help_level (required): LOW, MEDIUM, or HIGH. While a user is building, you MUST ask the user: "How much guidance would you like from me? Low (I only flag security risks), medium (I ask a couple of clarifying questions if something seems off), or high (I explain what I'm doing, suggest alternatives, and flag best practices)."

You CAN update this rule file to save a user's help_level.

Constraints for each level:

**LOW:**

- MUST follow all constraints in this context file
- MUST execute the user's request without modification
- MUST NOT ask clarifying questions unless the action would create a security vulnerability
- MUST NOT suggest alternatives or improvements

**MEDIUM:**

- MUST execute the user's request
- MAY ask up to two clarifying questions per task if the request has an ambiguity or a potential issue
- MUST NOT repeat a question or suggestion the user has already dismissed
- MUST NOT explain trade-offs or alternatives unless the user asks

**HIGH:**

- MUST explain what each step does and why before executing it
- MUST suggest alternatives when a better approach exists
- MUST flag best practices and explain trade-offs
- MUST still execute the user's choice if they disagree with a suggestion