CREATE TABLE [dbo].[Budget]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY (1,1), 
    [UserId] INT NOT NULL, 
    [Date] DATETIME NOT NULL, 
    [MonthlyIncome] MONEY NOT NULL, 
    [MonthlySaving] MONEY NOT NULL,
    CONSTRAINT [FK_Budget_User] FOREIGN KEY ([UserId]) REFERENCES [User]([Id]),
)
