#!/usr/bin/env node
import path from 'path';
import { fileURLToPath } from 'url';
import Fastify from 'fastify'
import fastifyStatic from '@fastify/static';
const fastify = Fastify({ logger: true })
fastify.register(fastifyStatic, {
	root: path.dirname(fileURLToPath(import.meta.url)),
});
await fastify.listen({ port: 12082, host: '::' })
