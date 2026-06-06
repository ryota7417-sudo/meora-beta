# HEY MVP Data Model Plan

This document outlines the planned Supabase tables for the first HEY MVP. No migrations are created in this task.

## users

- `id`: UUID primary key
- `display_name`: user-visible name
- `created_at`: account creation timestamp
- `updated_at`: last update timestamp

## ai_staff

- `id`: UUID primary key
- `name`: staff name, such as Manager, Writer, or Researcher
- `role`: short role label
- `description`: user-facing description
- `default_max_stamina`: baseline stamina cap
- `default_stamina_cost`: default stamina cost per request
- `created_at`: creation timestamp

## user_ai_stamina

- `id`: UUID primary key
- `user_id`: references `users.id`
- `ai_staff_id`: references `ai_staff.id`
- `current_stamina`: current stamina value
- `max_stamina`: user-specific stamina cap
- `recovered_on`: date of latest daily recovery
- `updated_at`: last update timestamp

## requests

- `id`: UUID primary key
- `user_id`: references `users.id`
- `ai_staff_id`: references `ai_staff.id`
- `content`: user request text
- `mock_response`: prototype response text until real AI is introduced
- `stamina_cost`: stamina consumed by the request
- `created_at`: request timestamp

## tasks

- `id`: UUID primary key
- `user_id`: references `users.id`
- `request_id`: optional reference to `requests.id`
- `ai_staff_id`: references `ai_staff.id`
- `title`: task title
- `status`: `todo`, `in_progress`, or `done`
- `created_at`: creation timestamp
- `updated_at`: last update timestamp

## daily_reports

- `id`: UUID primary key
- `user_id`: references `users.id`
- `report_date`: date covered by the report
- `request_count`: number of requests that day
- `stamina_used`: total stamina consumed
- `completed_task_count`: completed task count
- `summary`: report summary text
- `created_at`: creation timestamp

## learning_candidates

- `id`: UUID primary key
- `user_id`: references `users.id`
- `source_request_id`: optional reference to `requests.id`
- `content`: learning candidate text
- `source`: user-facing source label
- `status`: `pending`, `accepted`, `held`, or `rejected`
- `target`: target staff, memory, or skill area
- `created_at`: creation timestamp
- `updated_at`: last update timestamp

## agent_memories

- `id`: UUID primary key
- `user_id`: references `users.id`
- `ai_staff_id`: optional reference to `ai_staff.id`
- `content`: accepted memory content
- `source_learning_candidate_id`: optional reference to `learning_candidates.id`
- `created_at`: creation timestamp
- `updated_at`: last update timestamp

## agent_skills

- `id`: UUID primary key
- `ai_staff_id`: references `ai_staff.id`
- `name`: skill name
- `description`: skill behavior summary
- `instructions`: concise internal instructions
- `created_at`: creation timestamp
- `updated_at`: last update timestamp

## energy_drink_purchases

- `id`: UUID primary key
- `user_id`: references `users.id`
- `ai_staff_id`: optional reference to `ai_staff.id`
- `stamina_amount`: stamina restored
- `status`: `mock`, `pending`, `paid`, `failed`, or `refunded`
- `provider_reference`: payment provider reference when real payments are introduced
- `created_at`: creation timestamp

## Notes

- The current MVP uses browser local storage only.
- Real payments, AI API calls, and external integrations are intentionally out of scope.
- Supabase migrations should be added only after the product flow and table ownership rules are confirmed.
