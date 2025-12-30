create database natatorio

USE [natatorio]
GO
/****** Object:  Table [dbo].[Alumnos]    Script Date: 16/12/2025 11:08:58 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Alumnos](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[dni] [varchar](20) NULL,
	[nombre] [varchar](100) NOT NULL,
	[apellido] [varchar](100) NOT NULL,
	[telefono] [varchar](50) NULL,
	[email] [varchar](100) NULL,
	[fecha_registro] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Asistencias]    Script Date: 16/12/2025 11:08:58 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Asistencias](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[alumno_dni] [varchar](50) NULL,
	[dia] [varchar](50) NULL,
	[horario] [varchar](50) NULL,
	[fecha_registro] [datetime] NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Clases_Actividades]    Script Date: 16/12/2025 11:08:58 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Clases_Actividades](
	[id] [int] NOT NULL,
	[nombre] [varchar](100) NOT NULL,
	[descripcion] [text] NULL,
	[cupo_maximo] [int] NOT NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Horarios_Profesores]    Script Date: 16/12/2025 11:08:58 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Horarios_Profesores](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[profesor_id] [int] NULL,
	[dia] [varchar](50) NULL,
	[horario] [varchar](50) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Profesores]    Script Date: 16/12/2025 11:08:58 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Profesores](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[nombre] [varchar](100) NOT NULL,
	[apellido] [varchar](100) NOT NULL,
	[dni] [varchar](20) NULL,
	[telefono] [varchar](50) NULL,
	[especialidad] [varchar](100) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/****** Object:  Table [dbo].[Turnos]    Script Date: 16/12/2025 11:08:58 ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[Turnos](
	[id] [int] IDENTITY(1,1) NOT NULL,
	[alumno_id] [int] NULL,
	[dia] [varchar](20) NULL,
	[horario] [varchar](20) NULL,
PRIMARY KEY CLUSTERED 
(
	[id] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO
/*SET IDENTITY_INSERT [dbo].[Alumnos] ON 
GO
INSERT [dbo].[Alumnos] ([id], [dni], [nombre], [apellido], [telefono], [email], [fecha_registro]) VALUES (1, N'46097948', N'Jimena', N'Benitez', N'1153404350', N'jimebenitez@gmail.com', CAST(N'2025-12-15T11:34:45.377' AS DateTime))
GO
INSERT [dbo].[Alumnos] ([id], [dni], [nombre], [apellido], [telefono], [email], [fecha_registro]) VALUES (2, N'43653414', N'Melisa', N'Caro', N'1153340238', N'melisaailencaroo@gmail.com', CAST(N'2025-12-15T11:48:07.517' AS DateTime))
GO
INSERT [dbo].[Alumnos] ([id], [dni], [nombre], [apellido], [telefono], [email], [fecha_registro]) VALUES (3, N'43653415', N'melisa2', N'caro2', N'115334238', NULL, CAST(N'2025-12-16T10:51:01.230' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[Alumnos] OFF
GO
SET IDENTITY_INSERT [dbo].[Asistencias] ON 
GO
INSERT [dbo].[Asistencias] ([id], [alumno_dni], [dia], [horario], [fecha_registro]) VALUES (1, N'43653414', N'Viernes', N'14:00', CAST(N'2025-12-16T10:19:49.843' AS DateTime))
GO
INSERT [dbo].[Asistencias] ([id], [alumno_dni], [dia], [horario], [fecha_registro]) VALUES (2, N'46097948', N'Viernes', N'14:00', CAST(N'2025-12-16T10:24:46.673' AS DateTime))
GO
SET IDENTITY_INSERT [dbo].[Asistencias] OFF
GO
SET IDENTITY_INSERT [dbo].[Horarios_Profesores] ON 
GO
INSERT [dbo].[Horarios_Profesores] ([id], [profesor_id], [dia], [horario]) VALUES (2, 2, N'Lunes', N'18:00')
GO
INSERT [dbo].[Horarios_Profesores] ([id], [profesor_id], [dia], [horario]) VALUES (3, 1, N'Viernes', N'14:00')
GO
SET IDENTITY_INSERT [dbo].[Horarios_Profesores] OFF
GO
SET IDENTITY_INSERT [dbo].[Profesores] ON 
GO
INSERT [dbo].[Profesores] ([id], [nombre], [apellido], [dni], [telefono], [especialidad]) VALUES (1, N'Profesor', N'Prueba', N'11111111', NULL, N'Natación')
GO
INSERT [dbo].[Profesores] ([id], [nombre], [apellido], [dni], [telefono], [especialidad]) VALUES (2, N'Paula', N'Nyszta', N'123456', N'123456', N'Pileta')
GO
SET IDENTITY_INSERT [dbo].[Profesores] OFF
GO
ALTER TABLE [dbo].[Alumnos] ADD  DEFAULT (getdate()) FOR [fecha_registro]
GO
ALTER TABLE [dbo].[Asistencias] ADD  DEFAULT (getdate()) FOR [fecha_registro]
GO
ALTER TABLE [dbo].[Horarios_Profesores]  WITH CHECK ADD FOREIGN KEY([profesor_id])
REFERENCES [dbo].[Profesores] ([id])
GO
ALTER TABLE [dbo].[Turnos]  WITH CHECK ADD FOREIGN KEY([alumno_id])
REFERENCES [dbo].[Alumnos] ([id])
GO
ALTER TABLE [dbo].[Clases_Actividades]  WITH CHECK ADD CHECK  (([cupo_maximo]>(0)))
GO*/

select * from Alumnos 
select * from Profesores
select * from Asistencias
select * from Horarios_Profesores
select * from Turnos



delete from Turnos

SELECT * 
FROM asistencias
WHERE CONVERT(date, fecha_registro) = '2025-12-22'
SELECT *
FROM Asistencias
WHERE LEFT(horario,5) = '18:00'


SELECT a.id, a.fecha_registro, a.dia, a.horario, al.nombre, al.apellido, al.dni
                FROM Asistencias a
                INNER JOIN Alumnos al ON a.alumno_dni = al.dni
                WHERE CONVERT(date, a.fecha_registro) = '2025-12-22'
                AND horario = '11:00'
     
                ORDER BY a.fecha_registro DESC