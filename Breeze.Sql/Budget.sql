CREATE TABLE [dbo].[Budget]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY (1,1), 
    [UserId] NVARCHAR(50) NOT NULL, 
    [MonthlyIncome] DECIMAL(18, 2), 
    [MonthlyExpenses] DECIMAL(18, 2),
    [Date] DATE NOT NULL, 
)
