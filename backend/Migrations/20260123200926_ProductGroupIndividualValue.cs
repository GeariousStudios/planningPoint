using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace planningPoint.Migrations
{
    public partial class ProductGroupIndividualValue : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"
CREATE TABLE ""ProductGroupFieldValues_new"" (
    ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_ProductGroupFieldValues"" PRIMARY KEY AUTOINCREMENT,
    ""MasterPlanFieldId"" INTEGER NOT NULL,
    ""ProductGroupId"" INTEGER NOT NULL,
    ""ProductId"" INTEGER NOT NULL,
    ""Value"" TEXT NOT NULL,
    CONSTRAINT ""FK_ProductGroupFieldValues_MasterPlanFields_MasterPlanFieldId"" FOREIGN KEY (""MasterPlanFieldId"") REFERENCES ""MasterPlanFields"" (""Id"") ON DELETE CASCADE,
    CONSTRAINT ""FK_ProductGroupFieldValues_ProductGroups_ProductGroupId"" FOREIGN KEY (""ProductGroupId"") REFERENCES ""ProductGroups"" (""Id"") ON DELETE CASCADE,
    CONSTRAINT ""FK_ProductGroupFieldValues_Products_ProductId"" FOREIGN KEY (""ProductId"") REFERENCES ""Products"" (""Id"") ON DELETE CASCADE
);

INSERT INTO ""ProductGroupFieldValues_new"" (""Id"", ""MasterPlanFieldId"", ""ProductGroupId"", ""ProductId"", ""Value"")
SELECT
    pgfv.""Id"",
    pgfv.""MasterPlanFieldId"",
    pgfv.""ProductGroupId"",
    (
        SELECT pgp.""ProductId""
        FROM ""ProductGroupToProducts"" pgp
        WHERE pgp.""ProductGroupId"" = pgfv.""ProductGroupId""
        ORDER BY pgp.""Order""
        LIMIT 1
    ) AS ""ProductId"",
    pgfv.""Value""
FROM ""ProductGroupFieldValues"" pgfv
WHERE EXISTS (
    SELECT 1
    FROM ""ProductGroupToProducts"" pgp
    WHERE pgp.""ProductGroupId"" = pgfv.""ProductGroupId""
);

DROP TABLE ""ProductGroupFieldValues"";
ALTER TABLE ""ProductGroupFieldValues_new"" RENAME TO ""ProductGroupFieldValues"";

CREATE INDEX ""IX_ProductGroupFieldValues_MasterPlanFieldId"" ON ""ProductGroupFieldValues"" (""MasterPlanFieldId"");
CREATE INDEX ""IX_ProductGroupFieldValues_ProductGroupId"" ON ""ProductGroupFieldValues"" (""ProductGroupId"");
CREATE INDEX ""IX_ProductGroupFieldValues_ProductId"" ON ""ProductGroupFieldValues"" (""ProductId"");
"
            );
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(
                @"
CREATE TABLE ""ProductGroupFieldValues_old"" (
    ""Id"" INTEGER NOT NULL CONSTRAINT ""PK_ProductGroupFieldValues"" PRIMARY KEY AUTOINCREMENT,
    ""MasterPlanFieldId"" INTEGER NOT NULL,
    ""ProductGroupId"" INTEGER NOT NULL,
    ""Value"" TEXT NOT NULL,
    CONSTRAINT ""FK_ProductGroupFieldValues_MasterPlanFields_MasterPlanFieldId"" FOREIGN KEY (""MasterPlanFieldId"") REFERENCES ""MasterPlanFields"" (""Id"") ON DELETE CASCADE,
    CONSTRAINT ""FK_ProductGroupFieldValues_ProductGroups_ProductGroupId"" FOREIGN KEY (""ProductGroupId"") REFERENCES ""ProductGroups"" (""Id"") ON DELETE CASCADE
);

INSERT INTO ""ProductGroupFieldValues_old"" (""Id"", ""MasterPlanFieldId"", ""ProductGroupId"", ""Value"")
SELECT
    ""Id"",
    ""MasterPlanFieldId"",
    ""ProductGroupId"",
    ""Value""
FROM ""ProductGroupFieldValues"";

DROP TABLE ""ProductGroupFieldValues"";
ALTER TABLE ""ProductGroupFieldValues_old"" RENAME TO ""ProductGroupFieldValues"";

CREATE INDEX ""IX_ProductGroupFieldValues_MasterPlanFieldId"" ON ""ProductGroupFieldValues"" (""MasterPlanFieldId"");
CREATE INDEX ""IX_ProductGroupFieldValues_ProductGroupId"" ON ""ProductGroupFieldValues"" (""ProductGroupId"");
"
            );
        }
    }
}
