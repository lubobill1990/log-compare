import {
  IAutorunOptions,
  IReactionDisposer,
  IReactionOptions,
  IReactionPublic,
  autorun,
  reaction,
} from 'mobx';

export class AutoRunManager {
  private readonly reactionDisposers: IReactionDisposer[] = [];

  public autorun(
    autorunFunction: (r: IReactionPublic) => any,
    opts?: IAutorunOptions
  ) {
    this.reactionDisposers.push(autorun(autorunFunction, opts));
  }

  public reaction<T, FireImmediately extends boolean = false>(
    expression: (r: IReactionPublic) => T,
    effect: (
      arg: T,
      prev: FireImmediately extends true ? T | undefined : T,
      r: IReactionPublic
    ) => void,
    opts?: IReactionOptions<T, FireImmediately>
  ) {
    this.reactionDisposers.push(reaction(expression, effect, opts));
  }

  public addReactionDisposer(disposer: IReactionDisposer) {
    this.reactionDisposers.push(disposer);
  }

  public dispose() {
    this.reactionDisposers.forEach((disposer) => disposer());
  }
}
