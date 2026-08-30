import { Response } from "express";
import { generateForecast, getThreatWeather } from "../services/threatOracleService";

/**
 * GET /api/oracle/forecast
 * Get full 72-hour threat forecast
 */
export const getForecast = async (req: any, res: Response) => {
  try {
    const forecast = await generateForecast();
    return res.json(forecast);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

/**
 * GET /api/oracle/weather
 * Get threat weather summary
 */
export const getWeather = async (req: any, res: Response) => {
  try {
    const weather = await getThreatWeather();
    return res.json(weather);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
