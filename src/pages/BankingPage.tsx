import { useState } from "react";
const accounts = [
  {
    name: "Everyday checking",
    number: "4821",
    balance: 12450.75,
    kind: "For the day to day",
    tone: "green",
  },
  {
    name: "Rainy day savings",
    number: "9036",
    balance: 28600,
    kind: "A little peace of mind",
    tone: "cream",
  },
  {
    name: "Travel fund",
    number: "1158",
    balance: 3250,
    kind: "For your next adventure",
    tone: "lavender",
  },
];
const currency = (amount: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
export function BankingPage() {
  const [showBalances, setShowBalances] = useState(true);
  return (
    <>
      <div className="welcome">
        <div>
          <p className="eyebrow">YOUR MONEY, AT A GLANCE</p>
          <h1>Welcome back, Jane.</h1>
          <p>Room to grow. Freedom to plan. Let’s make today count.</p>
        </div>
        <span className="demo-pill">Demo account</span>
      </div>
      <section className="balance-banner" aria-labelledby="total-heading">
        <div>
          <p className="eyebrow">A LITTLE BIG PICTURE</p>
          <h2 id="total-heading">Total available balance</h2>
          <p className="total">
            {showBalances
              ? currency(accounts.reduce((sum, account) => sum + account.balance, 0))
              : "Balances hidden"}
          </p>
          <p>Across your three accounts</p>
        </div>
        <div className="banner-decoration" aria-hidden="true">
          ↗
        </div>
        <button
          className="balance-toggle"
          type="button"
          aria-pressed={!showBalances}
          data-testid="performance-action"
          onClick={() => setShowBalances((value) => !value)}
        >
          {showBalances ? "Hide balances" : "Show balances"}
        </button>
      </section>
      <section aria-labelledby="accounts-heading">
        <div className="section-heading">
          <h2 id="accounts-heading">Your accounts</h2>
          <span>Simple. Organized. Yours.</span>
        </div>
        <div className="accounts">
          {accounts.map((account) => (
            <article className={`account ${account.tone}`} key={account.number}>
              <div className="account-top">
                <span className="account-icon" aria-hidden="true">
                  {account.tone === "green" ? "↔" : account.tone === "cream" ? "◎" : "↗"}
                </span>
                <span>•• {account.number}</span>
              </div>
              <h3>{account.name}</h3>
              <p>{account.kind}</p>
              <p className="account-balance">
                {showBalances ? currency(account.balance) : "Hidden"}
              </p>
              <span className="available">Available balance</span>
            </article>
          ))}
        </div>
      </section>
      <div className="lower-grid">
        <section className="activity" aria-labelledby="activity-heading">
          <div className="section-heading">
            <h2 id="activity-heading">Recent activity</h2>
            <span>Checking account</span>
          </div>
          <table>
            <caption className="sr-only">Recent checking account transactions</caption>
            <thead>
              <tr>
                <th scope="col">Transaction</th>
                <th scope="col">Date</th>
                <th scope="col">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">Payroll deposit</th>
                <td>Oct 12</td>
                <td className="positive">+$3,200.00</td>
              </tr>
              <tr>
                <th scope="row">Neighborhood market</th>
                <td>Oct 11</td>
                <td>−$84.26</td>
              </tr>
              <tr>
                <th scope="row">Monthly savings</th>
                <td>Oct 10</td>
                <td>−$500.00</td>
              </tr>
            </tbody>
          </table>
        </section>
        <aside className="tip">
          <p className="eyebrow">SMALL STEPS, BIG POSSIBILITIES</p>
          <h2>A future worth saving for.</h2>
          <p>Your rainy day fund is growing. Keep giving tomorrow a little of today.</p>
          <div className="tip-line" aria-hidden="true">
            ✳ ───── ↗
          </div>
        </aside>
      </div>
    </>
  );
}
