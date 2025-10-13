import {Injectable, InternalServerErrorException, Logger} from '@nestjs/common';
import {IKeyboardService} from '@/keyboard/keyboard-model';

@Injectable()
export class KeyboardDarwinService implements IKeyboardService {
    constructor(
        private readonly logger: Logger
    ) {
    }

    // eslint-disable-next-line
    public async setKeyboardLayout(text: string): Promise<void> {
       throw new InternalServerErrorException('Not implemnted1');
    }

    // eslint-disable-next-line
    public async type(text: string): Promise<void> {
       throw new InternalServerErrorException('Not implemnted');
    }

    // eslint-disable-next-line
    public async sendKey(keys: string[], holdKeys: string[]): Promise<void> {
        throw new InternalServerErrorException('Not implemnted');
    }
}
