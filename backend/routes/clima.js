import express from 'express'
import { getClima } from '../controllers/clima.js'

const router = express.Router()
router.get('/', getClima)
export default router