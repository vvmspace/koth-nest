import * as dotenv from 'dotenv';
import * as fs from 'fs';

export class ConfigService {
  private readonly envConfig: { [key: string]: string };

  constructor(filePath: string) {
    this.envConfig = dotenv.parse(fs.readFileSync(filePath));
  }

  get(key: string, defaultValue: string = ''): string {
    return this.envConfig[key] || defaultValue;
  }

  getInt(key: string, defaultValue: number = 0): number {
    return this.envConfig[key] ? parseInt(this.envConfig[key]) : defaultValue;
  }

  isEnv(env: string) {
    return this.envConfig.APP_ENV === env;
  }
}
