import clustersConfig from 'common/src/config/clusters';
import { defaultImage } from 'common/src/config/images';
import deploymentGenerator from '../kubernetes/deploymentGenerator';
import { createDeployment, createService, createNetworkPolicy, createAutoScaler } from './stackBuilders';
import nameGenerator from '../common/nameGenerators';

async function createClusterStack({ type, volumeMount, condaPath, maxWorkers, maxWorkerMemoryGb, maxWorkerCpu, projectKey, name }) {
  // DASK -> dask
  const lowerType = type.toLowerCase();

  // distinguish between the scheduler and the worker deployments
  const schedulerName = `scheduler-${name}`;
  const workerName = `worker-${name}`;

  // these are referenced in other resources
  const schedulerServiceName = nameGenerator.deploymentName(schedulerName);
  const schedulerPodLabel = nameGenerator.podLabel(schedulerName);
  const workerPodLabel = nameGenerator.podLabel(workerName);

  const clusterParams = {
    type: lowerType,
    projectKey,
    volumeMount,
    condaPath,
    pureDaskImage: defaultImage('dask').image,
    jupyterLabImage: defaultImage('jupyterlab').image,
    // scheduler
    schedulerPodLabel,
    schedulerMemory: `${clustersConfig().dask.scheduler.memoryMax_GB.default}Gi`,
    schedulerCpu: clustersConfig().dask.scheduler.CpuMax_vCPU.default,
    // workers
    workerPodLabel,
    schedulerServiceName,
    nThreads: clustersConfig().dask.workers.nThreads.default,
    deathTimeoutSec: clustersConfig().dask.workers.deathTimeout_sec.default,
    workerMemory: `${maxWorkerMemoryGb}Gi`,
    workerCpu: maxWorkerCpu,
    // auto-scaling
    maxReplicas: maxWorkers,
    targetCpuUtilization: clustersConfig().dask.workers.targetCpuUtilization_percent.default,
    targetMemoryUtilization: clustersConfig().dask.workers.targetMemoryUtilization_percent.default,
    scaleDownWindowSec: clustersConfig().dask.workers.scaleDownWindow_sec.default,
  };

  // distinguish between the scheduler and the worker deployments (and related resources)
  const schedulerParams = { ...clusterParams, name: schedulerName };
  const workerParams = { ...clusterParams, name: workerName };

  // create network policy first, for security
  await createNetworkPolicy(schedulerParams, deploymentGenerator.createDatalabDaskSchedulerNetworkPolicy)();

  // do the rest in parallel
  await Promise.all([
    createDeployment(schedulerParams, deploymentGenerator.createDatalabDaskSchedulerDeployment)(),
    createService(schedulerParams, deploymentGenerator.createDatalabDaskSchedulerService)(),
    createDeployment(workerParams, deploymentGenerator.createDatalabDaskWorkerDeployment)(),
    createAutoScaler(workerParams, deploymentGenerator.createAutoScaler)(),
  ]);
}

export { createClusterStack }; // eslint-disable-line import/prefer-default-export
