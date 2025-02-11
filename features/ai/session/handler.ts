import axios from "axios";
import { Request, Response } from "express";
import { inject, injectable } from "tsyringe";

import { Result } from "./../../../application/result";
import { User } from "./../../../domain/entities/user";
import { EnvConfiguration, logger } from "./../../../utils";
import MxClient from "./../../../infrastructure/config/packages/mx";
import { ISettingsRepository } from "./../../../infrastructure/repositories/settings/i-settings-repository";
import { SettingsRepository } from "./../../../infrastructure/repositories/settings/settings-repository";
@injectable()
export default class SessionHandler {
  private readonly _mxClient: MxClient;
  private readonly _envConfiguration: EnvConfiguration;
  private readonly _settingsRepository: ISettingsRepository;
  constructor(
    @inject(MxClient) mxClient: MxClient,
    @inject(EnvConfiguration.name) envConfiguration: EnvConfiguration,
    @inject(SettingsRepository.name) settingsRepository: ISettingsRepository
  ) {
    this._mxClient = mxClient;
    this._envConfiguration = envConfiguration;
    this._settingsRepository = settingsRepository;
  }

  public async handle(req: Request, res: Response) {
    const currentUser = req.user as User;
    const settings = await this._settingsRepository.findSettingsByUserId(
      currentUser._id.toString()
    );

    const aiVoice = settings?.voice || "verse";

    const sessionResult = await this.createSession(req, aiVoice);
    if (sessionResult.isFailure) {
      return Result.Fail(sessionResult.errors);
    }

    return Result.Ok(sessionResult.value);
  }

  private async createSession(req: Request, aiVoice: string) {
    try {
      const currentUser = req.user as User;
      const mxUserId = currentUser.mxUsers[0].mxUserId;

      const countResponse = await this._mxClient.client.listTransactions(
        mxUserId,
        undefined,
        1,
        1
      );

      const totalTransactions = countResponse.data.pagination.total_entries;
      const totalPages = Math.ceil(totalTransactions / 1000);

      let allTransactions: any[] = [];
      for (let page = 1; page <= totalPages; page++) {
        const batchResponse = await this._mxClient.client.listTransactions(
          mxUserId,
          undefined,
          page,
          1000
        );
        allTransactions = [
          ...allTransactions,
          ...batchResponse.data.transactions,
        ];
      }

      const totals = allTransactions.reduce(
        (acc, t) => {
          if (t.is_income) acc.totalIncome += Number(t.amount);
          if (t.is_expense) acc.totalExpenses += Number(t.amount);
          acc.categories[t.top_level_category] =
            (acc.categories[t.top_level_category] || 0) + t.amount;
          acc.merchantFrequency[t.description] =
            (acc.merchantFrequency[t.description] || 0) + 1;
          if (t.amount > (acc.highestTransaction?.amount || 0)) {
            acc.highestTransaction = {
              amount: t.amount,
              description: t.description,
              category: t.top_level_category,
            };
          }
          return acc;
        },
        {
          totalIncome: 0,
          totalExpenses: 0,
          netChange: 0,
          categories: {},
          merchantFrequency: {},
          highestTransaction: null,
        }
      );

      const formattedTotals = {
        income: Number(totals.totalIncome.toFixed(2)),
        expenses: Number(totals.totalExpenses.toFixed(2)),
        netChange: Number(totals.totalIncome - totals.totalExpenses),
      };

      const transformedTransactions = allTransactions.map((t) => ({
        isIncome: t.is_income,
        isExpense: t.is_expense,
        amount: Number(t.amount),
        description: t.description,
        originalDescription: t.original_description,
        topLevelCategory: t.top_level_category,
        date: t.date,
        memo: t.memo,
      }));

      const spendingTrends = transformedTransactions.reduce(
        (acc, t) => {
          const date = new Date(t.date);
          const dayOfWeek = date.toLocaleString("en-US", { weekday: "long" });
          const monthYear = date.toLocaleString("en-US", {
            month: "long",
            year: "numeric",
          });

          if (t.isExpense) {
            acc.byDayOfWeek[dayOfWeek] =
              (acc.byDayOfWeek[dayOfWeek] || 0) + t.amount;

            if (t.amount >= 100) {
              acc.largeTransactions.push({
                date: t.date,
                amount: t.amount,
                description: t.description,
                category: t.topLevelCategory,
                formattedDate: new Date(t.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                }),
              });
            }

            acc.monthlySpending[monthYear] =
              (acc.monthlySpending[monthYear] || 0) + t.amount;
          }
          return acc;
        },
        { byDayOfWeek: {}, largeTransactions: [], monthlySpending: {} }
      );

      const transactionSummary = transformedTransactions.reduce(
        (summary, t) => {
          const month = new Date(t.date).toLocaleString("default", {
            month: "long",
          });
          if (!summary[month]) {
            summary[month] = {
              income: 0,
              expenses: 0,
              transactions: [],
              topCategories: new Map(),
              categoryTotals: new Map(),
              merchantTotals: new Map(),
              recurringExpenses: new Map(),
              largestExpenses: [],
            };
          }

          if (t.isIncome) summary[month].income += t.amount;
          if (t.isExpense) summary[month].expenses += t.amount;

          const descriptionKey = t.description.toLowerCase().trim();
          const merchantTotal =
            summary[month].merchantTotals.get(descriptionKey) || 0;
          summary[month].merchantTotals.set(
            descriptionKey,
            merchantTotal + t.amount
          );

          const categoryTotal =
            summary[month].categoryTotals.get(t.topLevelCategory) || 0;
          summary[month].categoryTotals.set(
            t.topLevelCategory,
            categoryTotal + t.amount
          );

          const currentCount =
            summary[month].topCategories.get(t.topLevelCategory) || 0;
          summary[month].topCategories.set(
            t.topLevelCategory,
            currentCount + 1
          );

          if (t.isExpense) {
            summary[month].transactions.push({
              description: t.description,
              originalDescription: t.originalDescription,
              amount: t.amount,
              category: t.topLevelCategory,
              date: t.date,
            });

            if (
              summary[month].transactions.some(
                (tr) =>
                  tr.description !== t.description &&
                  tr.description.toLowerCase().includes(descriptionKey)
              )
            ) {
              summary[month].recurringExpenses.set(descriptionKey, {
                amount: t.amount,
                category: t.topLevelCategory,
                frequency: "monthly",
              });
            }
          }

          return summary;
        },
        {}
      );

      logger(transactionSummary);

      const systemPrompt = `
        You are a highly specialized financial assistant designed to analyze and respond exclusively to queries related to personal finance, transactions, budgeting, investments, expenses, savings, and other financial matters.
        
        Overall Financial Summary:
        - Total Income (All Time): $${formattedTotals.income.toLocaleString(
          "en-US",
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        )}
        - Total Expenses (All Time): $${formattedTotals.expenses.toLocaleString(
          "en-US",
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        )}
        - Net Change (All Time): $${formattedTotals.netChange.toLocaleString(
          "en-US",
          { minimumFractionDigits: 2, maximumFractionDigits: 2 }
        )}
        
        Spending Analysis:
        - Highest Single Transaction: $${totals.highestTransaction?.amount.toFixed(
          2
        )} (${totals.highestTransaction?.description})
        - Most Frequent Transactions: ${Object.entries(totals.merchantFrequency)
          .sort((a, b) => Number(b[1]) - Number(a[1]))
          .slice(0, 5)
          .map(([desc, count]) => `${desc} (${count} times)`)
          .join(", ")}
        Spending by Day of Week:
        ${Object.entries(spendingTrends.byDayOfWeek)
          .sort((a, b) => Number(b[1]) - Number(a[1]))
          .map(([day, amount]) => `- ${day}: $${Number(amount).toFixed(2)}`)
          .join("\n")}
        
        Spending Trends Over Time:
        ${Object.entries(spendingTrends.monthlySpending)
          .sort((a, b) => new Date(b[0]).getTime() - new Date(a[0]).getTime())
          .map(([month, amount]) => `- ${month}: $${Number(amount).toFixed(2)}`)
          .join("\n")}
        
        Category Distribution:
        ${Object.entries(totals.categories)
          .sort((a, b) => Number(b[1]) - Number(a[1]))
          .map(
            ([category, amount]) =>
              `- ${category}: $${Number(amount).toFixed(2)} (${(
                (Number(amount) / formattedTotals.expenses) *
                100
              ).toFixed(1)}% of expenses)`
          )
          .join("\n")}
        
        Recent Large Transactions (>=$100):
        ${spendingTrends.largeTransactions
          .sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          )
          .slice(0, 10)
          .map(
            (t) =>
              `- ${t.formattedDate}: ${t.description} - $${t.amount.toFixed(
                2
              )} (${t.category})`
          )
          .join("\n")}

        Monthly Breakdown:
        ${Object.entries(transactionSummary)
          .map(
            ([month, data]) => `
          ${month}:
          - Total Income: $${(data as any).income.toFixed(2)}
          - Total Expenses: $${(data as any).expenses.toFixed(2)}
          - Net Change: $${(
            Number((data as any).income) - Number((data as any).expenses)
          ).toFixed(2)}
          
          Category Breakdown:
          ${Array.from((data as any).categoryTotals)
            .sort((a, b) => b[1] - a[1])
            .map(
              ([category, total]) =>
                `  • ${category}: $${Number(total).toFixed(2)}`
            )
            .join("\n")}
          
          Top Merchants/Services by Spend:
          ${Array.from((data as any).merchantTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8)
            .map(([merchant, total]) => `  • ${merchant}: $${total.toFixed(2)}`)
            .join("\n")}
          
          Potential Recurring Expenses:
          ${Array.from((data as any).recurringExpenses)
            .map(
              ([desc, info]) =>
                `  • ${desc}: $${info.amount.toFixed(2)} (${info.category})`
            )
            .join("\n")}
          
          Notable Transactions:
          ${(data as any).transactions
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5)
            .map(
              (t) =>
                `  • ${new Date(t.date).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}: ${t.description} (${t.category}) - $${t.amount.toFixed(
                  2
                )}\n    Original Description: ${t.originalDescription}`
            )
            .join("\n")}
        `
          )
          .join("\n\n")}
        
        Based on this comprehensive financial data:
        1. Analyze overall financial health and spending patterns
        2. Identify days of the week with highest spending
        3. Note any seasonal or monthly spending patterns
        4. Highlight categories that might need attention based on their percentage of total expenses
        5. Point out frequent transactions that might be optimized
        6. Suggest specific areas for potential savings
        7. Compare spending patterns across different time periods
        8. Identify any concerning trends or positive financial behaviors
        
        Your responses must always remain within the financial domain, even if the user tries to divert the conversation to unrelated topics.
      `.trim();

      logger(systemPrompt);

      const response = await axios.post(
        "https://api.openai.com/v1/realtime/sessions",
        {
          model: "gpt-4o-realtime-preview-2024-12-17",
          voice: aiVoice,
          instructions: systemPrompt,
          tools: [
            {
              type: "function",
              name: "analyze_transactions",
              description: "Analyze user transactions for insights",
              parameters: {
                type: "object",
                properties: {
                  transactions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        amount: { type: "number" },
                        description: { type: "string" },
                        date: { type: "string" },
                        category: { type: "string" },
                      },
                    },
                  },
                },
              },
            },
          ],
        },
        {
          headers: {
            Authorization: `Bearer ${this._envConfiguration.OPENAI_API_KEY}`,
            "Content-Type": "application/json",
            "OpenAI-Beta": "realtime-1.0.0",
          },
        }
      );

      if (response.data.error) {
        console.error("OpenAI Error:", response.data.error);
        return Result.Fail([{ message: response.data.error.message }]);
      }

      return Result.Ok(response.data);
    } catch (error: any) {
      console.error(
        "Session creation error:",
        error.response?.data || error.message
      );
      return Result.Fail([{ message: "Failed to create session" }]);
    }
  }
}
