using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace planningPoint.Migrations
{
    /// <inheritdoc />
    public partial class OPChecking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "CheckedOutAt",
                table: "OperationalPlans",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CheckedOutBy",
                table: "OperationalPlans",
                type: "TEXT",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsCheckedOut",
                table: "OperationalPlans",
                type: "INTEGER",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CheckedOutAt",
                table: "OperationalPlans");

            migrationBuilder.DropColumn(
                name: "CheckedOutBy",
                table: "OperationalPlans");

            migrationBuilder.DropColumn(
                name: "IsCheckedOut",
                table: "OperationalPlans");
        }
    }
}
