using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace planningPoint.Migrations
{
    /// <inheritdoc />
    public partial class IncrementalGuidKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "GlobalIncrementalKey",
                table: "MasterPlanIncrementalCounters",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "GlobalIncrementalKey",
                table: "MasterPlanFields",
                type: "TEXT",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GlobalIncrementalKey",
                table: "MasterPlanIncrementalCounters");

            migrationBuilder.DropColumn(
                name: "GlobalIncrementalKey",
                table: "MasterPlanFields");
        }
    }
}
