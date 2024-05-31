CREATE TABLE [dbo].[Budget]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY (1,1), 
    [UserEmail] NVARCHAR(150) NOT NULL, 
    [MonthlyIncome] DECIMAL(18, 2), 
    [MonthlyExpenses] DECIMAL(18, 2),
    [Year] INT NOT NULL, 
    [Month] INT NOT NULL,
)
