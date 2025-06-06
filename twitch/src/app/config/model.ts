
import { IsNotEmpty, IsString } from 'class-validator';

export class ChatBotConfig {
  @IsNotEmpty()
  @IsString()
  public tokenEndpoint: string;

  public token: string;

  @IsNotEmpty()
  @IsString()
  public username: string;

  @IsNotEmpty()
  @IsString()
  public clientId: string;

  @IsNotEmpty()
  @IsString()
  public clientSecret: string;

  @IsNotEmpty()
  @IsString()
  public authorizationCode: string;

  public channels: string[] = [];

  constructor(
    tokenEndpoint: string,
    token: string,
    username: string,
    clientId: string,
    clientSecret: string,
    authorizationCode: string,
    channels: string[]
  ) {
    this.tokenEndpoint = tokenEndpoint;
    this.token = token;
    this.username = username;
    this.clientSecret = clientSecret;
    this.channels = channels;
    this.clientId = clientId;
    this.authorizationCode = authorizationCode;
  }
}