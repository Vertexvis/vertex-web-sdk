import { GestureRecognizer } from './recognizer';
import { GestureResolver } from './resolver';
import { diffSet } from './utils';

export class GestureSystem {
  private recognizers = new Set<GestureRecognizer>();
  private acceptedRecognizer: GestureRecognizer | undefined;
  private rejectedRecognizers = new Set<GestureRecognizer>();

  public addRecognizer(recognizer: GestureRecognizer): void {
    this.recognizers.add(recognizer);
  }

  public handlePointer(event: PointerEvent): void {
    for (const recognizer of this.recognizers.keys()) {
      recognizer.addPointer(event, this.createResolver(recognizer));
    }
  }

  private acceptRecognizer(recognizer: GestureRecognizer): void {
    if (this.acceptedRecognizer == null) {
      this.acceptedRecognizer = recognizer;
      this.acceptedRecognizer.gestureAccepted();

      for (const recognizer of this.rejectedRecognizers.values()) {
        recognizer.gestureRejected();
      }
    }
  }

  private rejectRecognizer(recognizer: GestureRecognizer): void {
    this.rejectedRecognizers.add(recognizer);

    const diff = diffSet(this.recognizers, this.rejectedRecognizers);
    if (diff.size === 1) {
      this.acceptRecognizer(recognizer);
    }
  }

  private createResolver(recognizer: GestureRecognizer): GestureResolver {
    return {
      accept: () => {
        this.acceptRecognizer(recognizer);
      },
      reject: () => {
        this.rejectRecognizer(recognizer);
      },
    };
  }
}
