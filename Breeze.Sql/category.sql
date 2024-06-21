CREATE TABLE [dbo].[Category]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY (1,1), 
    [UserId] NVARCHAR(50) NOT NULL, 
    [Name] NVARCHAR(200) NOT NULL, 
    [BudgetId] INT NOT NULL,
    [Allocation] DECIMAL(18, 2) NOT NULL, 
    [CurrentSpend] DECIMAL(18, 2) NOT NULL, 
    CONSTRAINT [FK_Category_Budget] FOREIGN KEY ([BudgetId]) REFERENCES [Budget]([Id]),
)