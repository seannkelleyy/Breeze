﻿CREATE TABLE [dbo].[user]
(
	[Id] INT NOT NULL PRIMARY KEY IDENTITY (0,1), 
    [userId] NVARCHAR(50) NOT NULL, 
    [role] INT NOT NULL
)
