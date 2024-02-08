CREATE TABLE [dbo].[Budget]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY (1,1), 
    [UserId] NVARCHAR(150) NOT NULL, 
    [Date] DATETIME NOT NULL, 
    [MonthlyIncome] MONEY NOT NULL, 
    [MonthlyExpenses] MONEY NOT NULL,
    CONSTRAINT [FK_Budget_User] FOREIGN KEY ([UserId]) REFERENCES [User]([UserId]),
)
