import {app, globalShortcut} from 'electron'
import { ConfigReader } from '@/config-reader';
import {Logic} from "@/logic";
import { EventData } from '@/types';


async function start(): Promise<void> {
  await app.whenReady();
  app.on('will-quit', () => {
    globalShortcut.unregisterAll()
  });
  try {
    const configReader = new ConfigReader();
    const config = await configReader.getConfig();
    const logic = new Logic(config.ips, config.aliases, config.delay);
    console.debug("Connecting to clients...");
    const clientsList = await logic.createApi();
    console.debug(`Connected to ${clientsList.length} clients, registering shortcuts now...`);
    config.combinations.forEach((comb: EventData)  => {
      const ret = globalShortcut.register(comb.shortCut, () => logic.processEvent(comb))
      if (!ret) {
        throw Error(`registration ${comb.shortCut} failed`)
      }
    });
  } catch (e) {
    console.error('Application bootstrap has failed');
    console.error(e);
    app.exit(1);
  }
}

start();
