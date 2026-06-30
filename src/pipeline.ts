export interface Step {
  setNext(step: Step): Step;
  run(): Promise<void>;
}

export abstract class PipelineStep implements Step {
  private next?: Step;

  setNext(step: Step): Step {
    this.next = step;
    return step;
  }

  async run(): Promise<void> {
    const proceed = await this.execute();
    if (proceed) await this.next?.run();
  }

  // Возвращает true, если цепочку нужно продолжать; false — оборвать.
  protected abstract execute(): Promise<boolean>;
}
