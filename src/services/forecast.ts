import {ForecastPoint, StormGlass} from '@src/clients/stormGlass';
import { InternalError } from '@src/util/errors/internal-error';

export enum BeachPosition {
    S = 'S',
    E = 'E',
    W = 'W',
    N = 'N'
}
export interface Beach {
    name: string,
    position: BeachPosition,
    lat: number,
    lng: number,
    user: string,
}
export interface TimeForecast {
    time: string,
    forecast: BeachForecast[]
}

export interface BeachForecast extends Omit<Beach, 'user'>, ForecastPoint {
    rating: number
}

export class ForecastProcessingInternalError extends InternalError {
    constructor(message: string) {
        super(`unexpected error during the forecast processing: ${message}`)
    }
}
export class Forecast {
    constructor(protected stormGlass = new StormGlass()) {}

    public async processForecastForBeaches(beaches: Beach[]): Promise<TimeForecast[]> {
        const poinstWithCorrectSources: BeachForecast[] = [];
        
        try {
            for(const beach of beaches) {
                const points = await this.stormGlass.fetchPoints(beach.lat,beach.lng);
                const enrichedBeachData = this.enrichBeachData(beach, points);
    
                poinstWithCorrectSources.push(...enrichedBeachData);
            }
            return this.mapForecastByTime(poinstWithCorrectSources);
        } catch(error){
            throw new ForecastProcessingInternalError((error as Error).message);
        }
 
    }

    private mapForecastByTime(forecast: BeachForecast[]): TimeForecast[] {
        const forecastByTime: TimeForecast[] = [];

        for(const point of forecast) {
            const timePoint = forecastByTime.find((f) => f.time === point.time);
            if(timePoint){
                timePoint.forecast.push(point);
                
            } else {
                forecastByTime.push({
                    time: point.time,
                    forecast: [point]
                });
            }
        }
        
        return forecastByTime;

    }

    private enrichBeachData(beach: Beach,points: ForecastPoint[]): BeachForecast[] {
        return points.map((e) => ({
            ...{
                lat: beach.lat,
                lng:beach.lng,
                name: beach.name,
                position: beach.position,
                rating: 1
            },
            ...e,
        }));
    } 
}