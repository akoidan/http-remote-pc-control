import {IsNumber} from 'class-validator';


export class MouseClickRequest {
  @IsNumber()
  x: number;
  @IsNumber()
  y: number;
}

