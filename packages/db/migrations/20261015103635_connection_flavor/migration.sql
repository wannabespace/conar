CREATE TYPE "connection_flavor" AS ENUM('mariadb');--> statement-breakpoint
ALTER TABLE "connections" ADD COLUMN "flavor" "connection_flavor";