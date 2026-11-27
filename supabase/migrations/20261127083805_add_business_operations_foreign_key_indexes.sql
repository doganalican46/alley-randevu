create index notification_outbox_business_appointment_idx
  on public.notification_outbox(business_id, appointment_id)
  where appointment_id is not null;
create index payments_business_appointment_idx
  on public.payments(business_id, appointment_id)
  where appointment_id is not null;
create index payments_business_customer_idx
  on public.payments(business_id, customer_id)
  where customer_id is not null;
create index reviews_business_appointment_idx
  on public.reviews(business_id, appointment_id);
