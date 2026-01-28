using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace planningPoint.Migrations
{
    /// <inheritdoc />
    public partial class RemovedIncrementalTemp : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_MasterPlanIncrementalCounters_GlobalIncrementalKey",
                table: "MasterPlanIncrementalCounters");

            migrationBuilder.DropIndex(
                name: "IX_MasterPlanIncrementalCounters_MasterPlanId_MasterPlanFieldId",
                table: "MasterPlanIncrementalCounters");

            migrationBuilder.DropColumn(
                name: "GlobalIncrementalKey",
                table: "MasterPlanFields");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "GlobalIncrementalKey",
                table: "MasterPlanFields",
                type: "TEXT",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_MasterPlanIncrementalCounters_GlobalIncrementalKey",
                table: "MasterPlanIncrementalCounters",
                column: "GlobalIncrementalKey",
                unique: true,
                filter: "[GlobalIncrementalKey] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_MasterPlanIncrementalCounters_MasterPlanId_MasterPlanFieldId",
                table: "MasterPlanIncrementalCounters",
                columns: new[] { "MasterPlanId", "MasterPlanFieldId" },
                unique: true,
                filter: "[MasterPlanId] IS NOT NULL");
        }
    }
}
