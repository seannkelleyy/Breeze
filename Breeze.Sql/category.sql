CREATE TABLE [dbo].[Category]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY (1,1), 
    [UserId] NVARCHAR(50) NOT NULL, 
    [Name] NVARCHAR(50) NOT NULL, 
    [Date] DATETIME NOT NULL, 
    [Budget] MONEY NOT NULL, 
    [CurrentSpend] MONEY NOT NULL, 
    [BudgetId] INT NOT NULL,
    CONSTRAINT [FK_Category_Budget] FOREIGN KEY ([BudgetId]) REFERENCES [Budget]([Id]),
)