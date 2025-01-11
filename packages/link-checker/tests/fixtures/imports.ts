// Valid imports
import { foo } from './valid-module';
import * as bar from '../src/core/types';
import type { SomeType } from '@types/some-package';

// Invalid imports
import { missing } from './nonexistent-module';
import * as invalid from '../src/nonexistent/path';
import type { MissingType } from '@types/missing-package';

// Dynamic imports
const dynamicValid = import('./valid-module');
const dynamicInvalid = import('./nonexistent-module');
