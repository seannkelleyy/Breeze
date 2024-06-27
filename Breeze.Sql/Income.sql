CREATE TABLE [dbo].[Income]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY (1,1), 
    [UserId] NVARCHAR(50) NOT NULL, 
    [BudgetId] INT NOT NULL, 
    [Name] NVARCHAR(50) NOT NULL, 
    [Amount] DECIMAL(18, 2) NOT NULL,
    [Date] DATE NOT NULL,
    CONSTRAINT [FK_Income_Budget] FOREIGN KEY ([BudgetId]) REFERENCES [Budget]([Id]),
)
