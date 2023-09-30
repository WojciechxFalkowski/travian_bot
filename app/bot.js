import dotenv from 'dotenv'; //env variables

dotenv.config();

export const BASE_URL = process.env.TRAVIAN_SERVER
export const BACKEND_NEST_URL = process.env.BACKEND_NEST_URL
export const IS_AVAILABLE_ATTACK_OASIS = Boolean(process.env.IS_AVAILABLE_ATTACK_OASIS)