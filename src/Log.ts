import {createDefaultLogger} from '@tremho/gen-logger'

const Log = createDefaultLogger();
Log.setDefaultCategoryName('S3Actions')
Log.setMinimumLevel('Console', 'warn')
export default Log