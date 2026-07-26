# Project Scope — Nirvana CMS

## Problem

As a self-employed software engineer building websites for multiple clients, I kept
running into the same pain: WordPress-based CMS setups are bloated, hard to control,
and not a good fit for how I want to build and maintain client sites. I don't want to
keep working around WordPress — I want a CMS I own and control.

## Solution

A custom-built **headless CMS** that I design, build, and manage myself, purpose-fit
for the way I deliver client websites.

## Core Features

- **Multi-language support** — content can be authored and served in multiple languages.
- **Dynamic content body** — articles/content built from typed, reusable sections.
- **Dynamic pages** — pages assembled from configurable components, not fixed templates.

## Supporting Features

- Role-based access control
- Additional capabilities added as the system grows

## Key Concept: Application

All client websites are managed from **one single admin panel**, instead of a
separate CMS instance per site. Each website is modeled as an **Application** —
a deliberately generic term, not tied to "website," so the same system can later
manage other kinds of projects (e.g. a mobile app) without changing the core model.
