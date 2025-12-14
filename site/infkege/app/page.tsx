'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import {
  CalendarCheck,
  PlayCircle,
  Code,
  Car,
  SealCheck,
  HourglassHigh,
  UsersThree,
  Trophy,
  ChartLineUp,
  Student,
  CheckCircle,
  RocketLaunch,
  Certificate,
  Star,
  CheckFat,
  GraduationCap,
  Quotes,
  User,
  ArrowRight,
} from '@phosphor-icons/react'

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 }
}

const transition = {
  duration: 0.5,
  ease: [0.25, 0.1, 0.25, 1] as const
}

const stagger = {
  visible: {
    transition: {
      staggerChildren: 0.08
    }
  }
}

export default function AboutMePage() {
  return (
    <div className="min-h-screen bg-[--color-page-bg] text-[--color-text-primary] font-[var(--font-manrope)] overflow-x-hidden -mt-4 md:-mt-24 pt-4 md:pt-24">
      {/* Hero */}
      <motion.header
        className="pt-24 pb-16 text-center max-w-[900px] mx-auto px-5"
        initial="hidden"
        animate="visible"
        variants={stagger}
      >
        <motion.div
          variants={fadeInUp}
          transition={transition}
          className="inline-flex items-center gap-1.5 bg-[#E8F84E] text-black px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide border border-black/20 mb-6 cursor-default hover:rotate-[-2deg] hover:scale-105 transition-transform"
        >
          <CalendarCheck weight="bold" />
          Доступно с Сентября
        </motion.div>

        <motion.h1
          variants={fadeInUp}
          transition={transition}
          className="text-4xl md:text-6xl font-bold leading-tight tracking-tight mb-6 text-[--color-text-primary]"
        >
          Учу программированию<br />
          <span className="text-[--color-text-secondary] font-normal">с душой и результатом</span>
        </motion.h1>

        <motion.p
          variants={fadeInUp}
          transition={transition}
          className="text-lg text-[--color-text-secondary] max-w-[600px] mx-auto mb-10"
        >
          Python, C#, ОГЭ и ЕГЭ. Подготовка без стресса, на одной волне с учеником. Онлайн или Дистанционно.
        </motion.p>

        <motion.div variants={fadeInUp} transition={transition} className="flex justify-center">
          <a
            href="/shop"
            className="bg-[--color-action] text-[--color-action-text] px-8 py-4 rounded-xl font-semibold text-base inline-flex items-center gap-2 border border-[--color-border-main] hover:scale-105 active:scale-95 transition-transform"
          >
            <PlayCircle weight="fill" className="text-xl" />
            Начать бесплатно
          </a>
        </motion.div>
      </motion.header>

      {/* Bento Grid */}
      <div className="max-w-[1200px] mx-auto px-5 pb-24">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          variants={stagger}
        >
          {/* Profile Card - всегда тёмная */}
          <motion.div
            variants={fadeInUp}
            transition={transition}
            className="md:col-span-2 md:row-span-2 bg-gradient-to-b from-[#1A1A1A] to-[#0F0F0F] text-white rounded-3xl p-8 border border-white/[0.15] min-h-[500px] flex flex-col group hover:-translate-y-1 hover:border-white/30 transition-all duration-300"
          >
            <div className="w-full h-[450px] bg-[#222] rounded-xl mb-6 overflow-hidden border border-white/10 relative">
              <Image
                src="/marat.jpg"
                alt="Марат Ишимов"
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={100}
                className="object-cover object-[center_25%] group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { icon: User, label: 'Репетитор' },
                { icon: Code, label: 'Python & C#' },
                { icon: Car, label: 'Онлайн' },
              ].map((badge) => (
                <div
                  key={badge.label}
                  className="bg-white/10 px-3 py-1.5 rounded-full text-sm backdrop-blur-sm border border-white/10 flex items-center gap-1.5 hover:bg-white/20 transition-colors"
                >
                  <badge.icon weight="fill" className="text-sm" />
                  {badge.label}
                </div>
              ))}
            </div>
            <h2 className="text-3xl font-bold mb-2.5 flex items-center gap-2.5 text-white">
              Марат Ишимов
              <SealCheck weight="fill" className="text-2xl text-blue-500" />
            </h2>
            <p className="text-[#aaa] leading-relaxed">
              Репетитор по информатике. Готовлю к ОГЭ/ЕГЭ, ВУЗам и олимпиадам. Объясняю сложное простым языком. Есть патент — работаю официально.
            </p>
          </motion.div>

          {/* Stats */}
          {[
            { icon: HourglassHigh, number: '5+', label: 'лет опыта', sub: 'Обучаю с 2019 года. На сервисе 3 года.' },
            { icon: UsersThree, number: '2000+', label: 'уроков проведено', sub: 'Индивидуальные и групповые занятия.' },
            { icon: Trophy, number: '95+', label: 'баллов у топов', sub: 'Лучшие ученики стабильно сдают на 95-100.' },
            { icon: ChartLineUp, number: '89.3', label: 'ср. балл ЕГЭ', sub: '8 из 10 учеников сдают ОГЭ на макс. балл.' },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              variants={fadeInUp}
              transition={transition}
              className="bg-[--color-bg-secondary] rounded-3xl p-8 border border-[--color-border-main] min-h-[240px] flex flex-col group hover:-translate-y-1 hover:border-[--color-text-secondary]/30 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-[--color-zinc-100] rounded-full flex items-center justify-center text-2xl mb-4 border border-[--color-border-main] group-hover:bg-[--color-action] group-hover:text-[--color-action-text] group-hover:rotate-[15deg] transition-all duration-300">
                <stat.icon weight="duotone" />
              </div>
              <div className="text-5xl font-extrabold tracking-tight mb-1 leading-none text-[--color-text-primary]">{stat.number}</div>
              <div className="text-base text-[--color-text-secondary] font-semibold">{stat.label}</div>
              <p className="text-sm text-[--color-text-secondary] mt-auto border-t border-[--color-border-main] pt-3">{stat.sub}</p>
            </motion.div>
          ))}

          {/* University Card */}
          <motion.div
            variants={fadeInUp}
            transition={transition}
            className="md:col-span-2 bg-[--color-bg-secondary] rounded-3xl p-8 border border-[--color-border-main] hover:-translate-y-1 hover:border-[--color-text-secondary]/30 transition-all duration-300"
          >
            <h3 className="font-bold text-lg flex items-center gap-2 text-[--color-text-primary]">
              <Student weight="duotone" className="text-xl" />
              Куда поступают мои ученики
            </h3>
            <p className="text-[--color-text-secondary] mt-2">Мои выпускники учатся в ведущих ВУЗах страны.</p>
            <div className="flex flex-wrap gap-2 mt-5">
              {['МФТИ', 'МГТУ им. Баумана', 'ИТМО', 'РЭУ им. Плеханова', 'ИТИС КФУ'].map((uni) => (
                <div
                  key={uni}
                  className="bg-[--color-page-bg] px-3.5 py-2 rounded-lg font-bold text-sm border border-[--color-border-main] flex items-center gap-1.5 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 text-[--color-text-primary]"
                >
                  <CheckCircle weight="fill" className="text-[--color-text-secondary]" />
                  {uni}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Method Card */}
          <motion.div
            variants={fadeInUp}
            transition={transition}
            className="md:col-span-2 bg-[--color-bg-secondary] rounded-3xl p-8 border border-[--color-border-main] hover:-translate-y-1 hover:border-[--color-text-secondary]/30 transition-all duration-300"
          >
            <h3 className="font-bold text-lg flex items-center gap-2 text-[--color-text-primary]">
              <RocketLaunch weight="duotone" className="text-xl" />
              Система обучения
            </h3>
            <p className="text-[--color-text-secondary] mt-4 leading-relaxed">
              Разрабатываю собственные методические материалы и варианты ЕГЭ.
              Индивидуальные или парные занятия. Регулярные мониторинги прогресса и ДЗ после каждого урока.
              Благодаря молодому возрасту, я на одной волне с учениками.
            </p>
          </motion.div>
        </motion.div>


        {/* Experience List */}
        <div className="mt-16">
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-2xl font-bold mb-5 text-[--color-text-primary]"
          >
            Образование и достижения
          </motion.h3>

          {[
            { year: '2022', icon: Certificate, iconColor: '#E8F84E', title: 'КФУ. Диплом III степени', desc: 'Всероссийская научная конференция-конкурс имени Льва Толстого.' },
            { year: '2022', icon: Star, iconColor: '#E8F84E', title: 'ЕГЭ по информатике — 100 баллов', desc: 'Личный результат сдачи экзамена.' },
            { year: '2023-25', icon: CheckFat, iconColor: '#4CAF50', title: 'Подтверждение квалификации', desc: 'Ежегодная сдача ЕГЭ на 98 баллов.' },
            { year: 'ВУЗ', icon: GraduationCap, iconColor: 'var(--color-text-primary)', title: 'КГАСУ', desc: 'Специальность «Информационные системы и технологии».' },
          ].map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="flex py-6 px-5 border-b border-[--color-border-main] last:border-b-0 items-start rounded-xl cursor-default hover:bg-[--color-bg-secondary]/60 transition-colors"
            >
              <div className="font-bold text-[--color-text-primary] font-mono text-lg min-w-[100px]">{item.year}</div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold mb-1 flex items-center gap-2 text-[--color-text-primary]">
                  <item.icon weight="fill" style={{ color: item.iconColor }} />
                  {item.title}
                </h4>
                <p className="text-[--color-text-secondary] text-base">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="mt-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-center mb-10"
          >
            <h2 className="text-3xl font-bold text-[--color-text-primary]">Что говорят ученики</h2>
            <p className="text-[--color-text-secondary]">Реальные истории успеха</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { text: '"Марат — лучший преподаватель! За полгода поднял мой уровень с нуля до 90 баллов. Очень круто, что он объясняет на мемах и понятных примерах, а не сухим языком."', name: 'Алексей Смирнов', role: 'Поступил в МФТИ' },
              { text: '"Занимались дистанционно. Очень удобная платформа, свои методички. Сдала ЕГЭ на 98 баллов, хотя в начале года боялась даже открывать задачи по Python."', name: 'Екатерина Волкова', role: 'Студентка ИТМО' },
              { text: '"Понравилось, что Марат на одной волне. Нет ощущения, что сидишь на скучном уроке в школе. Всё по делу, четко, без воды. Результат — бюджет в Бауманке!"', name: 'Дмитрий Ковалев', role: 'Поступил в МГТУ' },
            ].map((review, i) => (
              <motion.div
                key={review.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-[--color-bg-secondary] p-6 rounded-3xl border border-[--color-border-main] hover:-translate-y-2 hover:border-[--color-text-secondary]/30 transition-all duration-300"
              >
                <div className="mb-3">
                  <Quotes weight="fill" className="text-2xl text-[--color-text-primary]" />
                </div>
                <p className="text-base leading-relaxed mb-5 text-[--color-text-primary]">{review.text}</p>
                <div className="flex items-center gap-3 border-t border-[--color-border-main] pt-4">
                  <div className="w-10 h-10 rounded-full bg-[--color-zinc-100] flex items-center justify-center text-[--color-text-primary] text-xl border border-[--color-border-main]">
                    <User weight="fill" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-[--color-text-primary]">{review.name}</h5>
                    <span className="text-xs text-[--color-text-secondary]">{review.role}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer CTA - всегда тёмный */}
        <motion.div
          id="contact"
          className="bg-gradient-to-b from-[#1A1A1A] to-[#050505] text-white rounded-3xl py-20 px-10 text-center mt-20 border border-white/[0.15] relative overflow-hidden group"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          <h2 className="text-4xl font-bold mb-5 relative z-10 text-white">Готовы к высоким баллам?</h2>
          <p className="text-[#aaa] mb-8 max-w-[600px] mx-auto relative z-10">
            Напишите мне, проведём бесплатный пробный созвон, познакомимся и составим индивидуальный план подготовки на желаемый результат!
          </p>
          <a
            href="/shop"
            className="bg-white text-black px-8 py-4 rounded-xl font-bold inline-flex items-center gap-2 relative z-10 border border-black/10 hover:scale-105 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] transition-all duration-300"
          >
            Записаться на пробное занятие
            <ArrowRight weight="bold" />
          </a>
          <div className="mt-8 opacity-60 text-xs relative z-10">
            © 2024 Марат Ишимов. Деятельность ведётся официально (Патент).
          </div>
        </motion.div>
      </div>
    </div>
  )
}
