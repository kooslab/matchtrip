CREATE INDEX "destinations_city_idx" ON "destinations" USING btree ("city");--> statement-breakpoint
CREATE INDEX "destinations_country_idx" ON "destinations" USING btree ("country");--> statement-breakpoint
CREATE INDEX "offers_guide_id_idx" ON "offers" USING btree ("guide_id");--> statement-breakpoint
CREATE INDEX "offers_trip_id_idx" ON "offers" USING btree ("trip_id");--> statement-breakpoint
CREATE INDEX "offers_status_idx" ON "offers" USING btree ("status");--> statement-breakpoint
CREATE INDEX "offers_guide_status_idx" ON "offers" USING btree ("guide_id","status");--> statement-breakpoint
CREATE INDEX "trips_user_id_idx" ON "trips" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "trips_status_idx" ON "trips" USING btree ("status");--> statement-breakpoint
CREATE INDEX "trips_destination_id_idx" ON "trips" USING btree ("destination_id");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_email_idx" ON "users" USING btree ("email");