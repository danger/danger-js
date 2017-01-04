import {Jenkins} from '../Jenkins';

const correctEnv = {
  'ghprbGhRepository': 'danger/danger-js',
  'ghprbPullId': '50',
  'JENKINS_URL': 'https://danger.jenkins'
};

describe('.isCI', () => {
  it('validates when JENKINS_URL is present in environment', () => {
    const jenkins = new Jenkins(correctEnv);
    expect(jenkins.isCI).toBeTruthy();
  });

  it('does not validate without JENKINS_URL', () => {
    const jenkins = new Jenkins({});
    expect(jenkins.isCI).toBeFalsy();
  });
});

describe('.isPR', () => {
  it('validates when all Jenkins environment variables are set', () => {
    const jenkins = new Jenkins(correctEnv);
    expect(jenkins.isPR).toBeTruthy();
  });

  it('does not validate with required environment variables', () => {
    const jenkins = new Jenkins({});
    expect(jenkins.isPR).toBeFalsy();
  });

  const envs = ['JENKINS_URL', 'ghprbPullId', 'ghprbGhRepository'];
  envs.forEach((key: string) => {
    const env = {
      ...correctEnv,
      [key]: null
    };

    it(`does not validate when ${key} is missing`, () => {
      const jenkins = new Jenkins(env);
      expect(jenkins.isPR).toBeFalsy();
    });
  });

  it('needs to have a PR number', () => {
    const env = {
      ...correctEnv,
      'ghprbPullId': 'not a number'
    };
    const jenkins = new Jenkins(env);
    expect(jenkins.isPR).toBeFalsy();
  });
});

describe('.pullRequestID', () => {
  it('pulls it out of environment', () => {
    const jenkins = new Jenkins(correctEnv);
    expect(jenkins.pullRequestID).toEqual('50');
  });
});

describe('.repoSlug', () => {
  it('pulls it out of environment', () => {
    const jenkins = new Jenkins(correctEnv);
    expect(jenkins.repoSlug).toEqual('danger/danger-js');
  });
});
