-- Таблица заявок на восстановление доступа к курсам
-- Статусы: pending (в рассмотрении), approved (одобрено), rejected (отклонено)

CREATE TYPE recovery_request_status AS ENUM ('pending', 'approved', 'rejected');

CREATE TABLE public.recovery_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  has_documents boolean NOT NULL DEFAULT false,
  selected_items jsonb NOT NULL, -- массив выбранных курсов/пакетов
  comment text,
  status recovery_request_status NOT NULL DEFAULT 'pending',
  admin_comment text, -- комментарий от админа
  granted_items jsonb, -- какие курсы реально выдали (может отличаться от selected_items)
  reviewed_by uuid, -- кто рассмотрел заявку
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  
  CONSTRAINT recovery_requests_pkey PRIMARY KEY (id),
  CONSTRAINT recovery_requests_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT recovery_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)
);

-- Индексы
CREATE INDEX recovery_requests_user_id_idx ON public.recovery_requests(user_id);
CREATE INDEX recovery_requests_status_idx ON public.recovery_requests(status);
CREATE INDEX recovery_requests_created_at_idx ON public.recovery_requests(created_at DESC);

-- RLS политики
ALTER TABLE public.recovery_requests ENABLE ROW LEVEL SECURITY;

-- Пользователь может видеть только свои заявки
CREATE POLICY "Users can view own recovery requests"
  ON public.recovery_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Пользователь может создавать заявки
CREATE POLICY "Users can create recovery requests"
  ON public.recovery_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Только админы могут обновлять заявки (через service role)
