CREATE TABLE [dbo].[Income]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY (1,1), 
    [UserEmail] NVARCHAR(150) NOT NULL, 
    [Name] NVARCHAR(50) NOT NULL, 
    [Date] DATETIME NOT NULL, 
    [Amount] MONEY NOT NULL,
    [BudgetId] INT NOT NULL, 
    CONSTRAINT [FK_Income_Budget] FOREIGN KEY ([BudgetId]) REFERENCES [Budget]([Id]),
    CONSTRAINT [FK_Income_User] FOREIGN KEY ([UserEmail]) REFERENCES [User]([UserEmail]),
)
