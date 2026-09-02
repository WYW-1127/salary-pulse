# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Vite + Vue 3 (`<script setup>`) + TypeScript + vitest；纯前端静态产物，无后端
（用户确认）。视觉不依赖 UI 组件库，原生 CSS 设计令牌。

## Users

中国打工人，自用为主。上班时间把页面挂在浏览器（或手机主屏），想看到
「此刻已经赚了多少」实时增长。本人即唯一配置者。

## Product Purpose

把抽象的月薪换算成工作时每一秒可见的收入增长，让上班这件事有即时获得感。
成功 = 用户愿意整天开着这个页面，并且相信数字是准的。

## Positioning

金额不靠页面累加，而是从绝对时间精确推导（劳动法 21.75 计薪日口径），
关页面、换设备、改时间都不漂移；配合行情隐喻的状态语言
（未开盘 / 交易中 / 午间休市 / 加班中 / 休市）。

## Operating Context

工作日 9-18 点挂在桌面浏览器标签页；下班后到睡前可能继续看加班计费；
周末打开看到「休市」。配置一次长期不变。

## Capabilities and Constraints

- 计薪：月薪 ÷ (21.75 × 每日有效秒数) 或 年薪 ÷ (261 × …)；午休不计薪
- 加班：仅工作日下班后按倍率（默认 1.5）计，周末不计
- 配置仅存 localStorage（键 `salary-pulse.config.v1`），无账号无同步
- v1 明确不做：节假日日历、涨薪历程、云同步、税后精确
- 完整规格：docs/superpowers/specs/2026-09-02-salary-pulse-design.md

## Brand Commitments

产品名「薪资跳动」。状态徽章使用行情术语命名（已确认）。
界面语言：中文。

## Evidence on Hand

- 已确认的功能规格（docs/superpowers/specs/2026-09-02-salary-pulse-design.md）
- 页面功能清单（页面清单.md）
- 无真实品牌资产、无 logo、无真实用户证言（不得虚构）

## Product Principles

1. 数字精确可信是底线，爽感建立在准的基础上
2. 跳动是产品本体：主数字是页面唯一的主角
3. 零运维：静态文件 + localStorage，永久可用
4. 克制：除主数字外一切安静退后
