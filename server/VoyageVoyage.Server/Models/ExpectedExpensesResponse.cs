namespace VoyageVoyage.Server.Models;

public enum ExpectedExpenseDayRole
{
    First,
    Last,
    Intermediate,
    Single,
}

public enum ExpectedExpenseState
{
    Done,
    Missing,
}

public sealed record ExpectedExpensesSummary(int Total, int Covered, int Missing);

public sealed record ExpectedExpenseSlot(
    string SlotId,
    ExpenseCategory Category,
    string Detail,
    ExpectedExpenseState State,
    string? ExpenseId);

public sealed record ExpectedExpenseDay(
    DateOnly Date,
    ExpectedExpenseDayRole Role,
    IReadOnlyList<ExpectedExpenseSlot> Slots);

public sealed record ExpectedExpensesResponse(
    ExpectedExpensesSummary Summary,
    IReadOnlyList<ExpectedExpenseDay> Days);
