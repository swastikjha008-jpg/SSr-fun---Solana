# ⚡ SSR.FUN Companion

### Strategic Portfolios. Transparent Thinking. Solana Powered.

A premium Web3 companion platform built around the **SSR.FUN Beta Launch Challenge**. Explore investment strategies, visualize portfolio allocations, document investment theses, and organize beta testing contributions through a beautifully designed interface.

<p align="center">
  <img src="https://img.shields.io/badge/STATUS-IN%20DEVELOPMENT-38BDF8?style=for-the-badge" />
  <img src="https://img.shields.io/badge/ECOSYSTEM-SOLANA-9945FF?style=for-the-badge&logo=solana&logoColor=white" />
  <img src="https://img.shields.io/badge/PROJECT-WEB3-111827?style=for-the-badge" />
</p>

<p align="center">
  <a href="https://ssr.fun/">SSR.FUN</a> ·
  <a href="https://superteam.fun/earn/listing/ssrfun-beta-launch-challenge">Superteam Challenge</a> ·
  <a href="https://x.com/strategicsuperr">Official X</a>
</p>

---

## ✨ About the Project

**SSR.FUN Companion** is an independent companion application designed to present and organize participation in the SSR.FUN Beta Launch Challenge.

SSR.FUN is a Solana-based launchpad for tokenized portfolios, supporting crypto assets and tokenized stocks and ETFs.

This project focuses on creating a professional experience around:

- 📊 Portfolio allocation and visualization.
- 🧠 Investment thesis and strategic documentation.
- 🔍 Beta testing observations and feedback management.
- 🔗 Solana ecosystem integration.
- 📋 Campaign progress and submission tracking.

The goal is to combine a polished frontend with a structured backend to make portfolio presentation and beta contributions easier to manage.

## 🚀 Key Features

### 📊 Portfolio Management
- Organize portfolio assets.
- Visualize asset allocation.
- Display asset information and percentages.
- Present portfolio strategies.
- Interactive portfolio charts.

### 🧠 Investment Thesis
- Document investment strategies.
- Explain asset selection.
- Present investment rationale.
- Highlight diversification and risk considerations.
- Associate investment theses with Reserve links.

### 🐛 Beta Feedback Management
- Document platform observations.
- Organize bug reports.
- Track UX improvement suggestions.
- Categorize feedback by priority.
- Maintain feedback submission records.

### 🔗 Solana Integration
- Solana ecosystem connectivity.
- Public wallet address support.
- Read-only blockchain data integration where supported.
- External Reserve references.

### 📋 Campaign Tracker
- Track campaign participation requirements.
- Organize wallet and X profile information.
- Record investment thesis post links.
- Track feedback submission confirmations.
- Keep submission information organized.

### 🎨 Interactive UI
- Animated ASCII background.
- EchoText animated typography.
- Modern glassmorphism.
- Interactive charts.
- Responsive layouts.
- Dark Web3-inspired visual identity.

---

## 🛠️ Tech Stack

### Frontend

<p>
  <img src="https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white" />
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/shadcn%2Fui-000000?style=for-the-badge&logo=shadcnui&logoColor=white" />
</p>

### Backend & Database

<p>
  <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" />
  <img src="https://img.shields.io/badge/Prisma-2D3748?style=for-the-badge&logo=prisma&logoColor=white" />
  <img src="https://img.shields.io/badge/Zod-3068B7?style=for-the-badge&logo=zod&logoColor=white" />
</p>

### Web3 & Blockchain

<p>
  <img src="https://img.shields.io/badge/Solana-9945FF?style=for-the-badge&logo=solana&logoColor=white" />
  <img src="https://img.shields.io/badge/Web3.js-F16822?style=for-the-badge&logo=javascript&logoColor=white" />
</p>

### Visualization & Tools

<p>
  <img src="https://img.shields.io/badge/Recharts-22B5BF?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Lucide_Icons-F56565?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" />
  <img src="https://img.shields.io/badge/pnpm-F69220?style=for-the-badge&logo=pnpm&logoColor=white" />
</p>

---

## 🏗️ Architecture

The application follows a modular architecture, separating frontend presentation, backend services, database persistence, and external blockchain integrations.

```text
                  SSR.FUN COMPANION
                          |
             +------------+------------+
             |                         |
        FRONTEND                   BACKEND
             |                         |
       Next.js / React              Node.js
             |                         |
       +-----+------+             +----+-----+
       |     |      |             |    |     |
      UI   Charts  Pages         APIs Services Auth
       |                         |
       |                       Prisma ORM
       |                         |
       |                      PostgreSQL
       |                         
       +-----------+-------------+
                   |
             EXTERNAL SERVICES
                   |
          +--------+--------+
          |                 |
       Solana RPC         SSR.FUN
       (Read-only)       (External)
```

### Suggested Project Structure

```text
ssrfun-companion/
│
├── app/
│   ├── api/
│   │   └── v1/
│   ├── page.tsx
│   ├── layout.tsx
│   └── globals.css
│
├── components/
│   ├── ui/
│   │   ├── m-ascii.tsx
│   │   ├── EchoText.tsx
│   │   └── EchoText.css
│   │
│   └── sections/
│       ├── Navbar.tsx
│       ├── Hero.tsx
│       ├── ReserveOverview.tsx
│       ├── InvestmentThesis.tsx
│       ├── AssetAllocation.tsx
│       ├── BetaFeedback.tsx
│       └── FinalCTA.tsx
│
├── lib/
│   ├── db.ts
│   ├── solana.ts
│   ├── validation.ts
│   └── utils.ts
│
├── services/
│   ├── reserve.service.ts
│   ├── portfolio.service.ts
│   ├── thesis.service.ts
│   └── feedback.service.ts
│
├── prisma/
│   └── schema.prisma
│
├── types/
│
├── public/
│
├── .env.example
├── package.json
└── README.md
```

*The structure is a reference architecture and can be adapted to the existing repository.*

---

## ⚙️ Getting Started

### Prerequisites

Make sure you have:

- Node.js
- pnpm
- PostgreSQL
- Git
- A Solana-compatible wallet for interacting with SSR.FUN.

### 1. Clone the Repository

```bash
git clone <YOUR_REPOSITORY_URL>
cd ssrfun-companion
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment Variables

Create a `.env` file in the project root.

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/ssrfun?schema=public"

SESSION_SECRET="your-long-random-session-secret"

ADMIN_EMAIL="admin@example.com"
ADMIN_PASSWORD_HASH="your-secure-password-hash"

SOLANA_RPC_URL="https://api.mainnet-beta.solana.com"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Never commit your actual credentials or secrets.

### 4. Initialize Prisma

```bash
pnpm exec prisma generate
pnpm exec prisma migrate dev
```

### 5. Start Development Server

```bash
pnpm dev
```

Open:

```text
http://localhost:3000
```

*The commands above assume the corresponding package scripts and Prisma configuration are present in the repository.*

---

## 🔗 SSR.FUN Challenge

This project is being developed around the official SSR.FUN Beta Launch Challenge hosted on Superteam Earn.

The challenge focuses on three reward categories:

| Category | Reward |
|---|---:|
| Highest Trading Volume | $150 USDC |
| Highest PnL | $100 USDC |
| Best Beta Contributor | $50 USDC |
| **Total** | **$300 USDC** |

### Participation Requirements

1. Connect a Solana wallet and register with an X handle on SSR.FUN.
2. Create a Reserve or trade an existing Reserve.
3. Follow the official SSR X account.
4. Publish an X post explaining your investment thesis and link your Reserve.
5. Submit at least one piece of feedback through SSR.FUN's in-app feedback button.
6. Submit the required wallet address, X post link, and feedback confirmation through Superteam Earn.

**Important:** Actual Reserve creation, trading, and official beta feedback submission happen directly on SSR.FUN. This companion application organizes and presents related information; it does not execute trades or replace SSR.FUN.

Read the full challenge: [SSR.FUN Beta Launch Challenge](https://superteam.fun/earn/listing/ssrfun-beta-launch-challenge).

---

## 🔐 Security & Data Integrity

- Never collect wallet seed phrases or private keys.
- Keep sensitive environment variables server-side.
- Protect administrative endpoints.
- Validate all API inputs.
- Use proper authorization.
- Distinguish illustrative portfolio data from verified holdings.
- Never display fabricated PnL or transaction information.
- Use documented, supported external integrations only.

---

## 🗺️ Development Roadmap

- [ ] Frontend design and responsive layouts.
- [ ] Animated ASCII background integration.
- [ ] EchoText typography integration.
- [ ] Portfolio allocation visualization.
- [ ] Investment thesis management.
- [ ] PostgreSQL and Prisma integration.
- [ ] Backend API development.
- [ ] Beta feedback management.
- [ ] Campaign progress tracker.
- [ ] Solana read-only integration, where supported.
- [ ] Testing and production deployment.

---

## 🤝 Contributing

Contributions, feature suggestions, bug reports, and UI/UX improvements are welcome.

1. Fork the repository.
2. Create a feature branch.
3. Commit your changes.
4. Open a Pull Request describing your contribution.

---

## ⚠️ Disclaimer

This is an independent companion project developed in connection with the SSR.FUN Beta Launch Challenge.

It is not an official SSR.FUN product and is not affiliated with or endorsed by SSR.FUN or Superteam.

Cryptocurrency and tokenized asset trading involve financial risks. This project does not provide financial advice or guarantee investment returns.

---

<p align="center">
  <strong>Built with curiosity, strategy, and Solana.</strong>
  <br />
  Exploring the future of tokenized portfolios.
</p>

<p align="center">
  <a href="https://ssr.fun/">SSR.FUN</a> ·
  <a href="https://superteam.fun/">Superteam</a> ·
  <a href="https://solana.com/">Solana</a>
</p>
