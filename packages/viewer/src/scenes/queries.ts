import { SceneItemOperationsExecutor } from './scene';
import { UUID } from '@vertexvis/utils';
import { CommandRegistry } from '../commands/commandRegistry';

interface AllQueryExpression {
  type: 'all';
}

interface ItemQueryExpression {
  type: 'item-id' | 'supplied-id';
  value: string;
}

export interface AndExpression {
  type: 'and';
  expressions: QueryExpression[];
}

export interface OrExpression {
  type: 'or';
  expressions: QueryExpression[];
}

/**
 * Represents the sum of all possible types of expressions.
 */
export type QueryExpression =
  | AllQueryExpression
  | ItemQueryExpression
  | AndExpression
  | OrExpression;

/**
 * An interface that represents a query is "complete" and can be turned into an
 * expression.
 */
interface TerminalQuery {
  build(): QueryExpression;
}

interface ItemQuery<N> {
  withItemId(id: string): N;

  withSuppliedId(id: string): N;
}

interface BooleanQuery {
  and(): AndQuery;
  or(): OrQuery;
}

export class RootQuery implements ItemQuery<SingleQuery> {
  public all(): AllQuery {
    return new AllQuery();
  }

  public withItemId(id: string): SingleQuery {
    return new SingleQuery({ type: 'item-id', value: id });
  }

  public withSuppliedId(id: string): SingleQuery {
    return new SingleQuery({ type: 'supplied-id', value: id });
  }
}

export class AllQuery implements TerminalQuery {
  public build(): QueryExpression {
    return { type: 'all' };
  }
}

class SingleQuery implements TerminalQuery, BooleanQuery {
  public constructor(private query: QueryExpression) {}

  public build(): QueryExpression {
    return { ...this.query };
  }

  public and(): AndQuery {
    return new AndQuery([this.query]);
  }

  public or(): OrQuery {
    return new OrQuery([this.query]);
  }
}

export class OrQuery implements TerminalQuery, ItemQuery<OrQuery> {
  public constructor(private expressions: QueryExpression[]) {}

  public build(): QueryExpression {
    return { type: 'or', expressions: [...this.expressions] };
  }

  public withItemId(id: string): OrQuery {
    return new OrQuery([...this.expressions, { type: 'item-id', value: id }]);
  }

  public withSuppliedId(id: string): OrQuery {
    return new OrQuery([
      ...this.expressions,
      { type: 'supplied-id', value: id },
    ]);
  }

  public or(): OrQuery {
    return this;
  }
}

export class AndQuery implements TerminalQuery, ItemQuery<AndQuery> {
  public constructor(private expressions: QueryExpression[]) {}

  public build(): QueryExpression {
    return { type: 'and', expressions: [...this.expressions] };
  }

  public withItemId(id: string): AndQuery {
    return new AndQuery([...this.expressions, { type: 'item-id', value: id }]);
  }

  public withSuppliedId(id: string): AndQuery {
    return new AndQuery([
      ...this.expressions,
      { type: 'supplied-id', value: id },
    ]);
  }

  public and(): AndQuery {
    return this;
  }
}

export class SceneItemQueryExecutor {
  public constructor(
    private sceneViewId: UUID.UUID,
    private commands: CommandRegistry
  ) {}

  public where(
    query: (q: RootQuery) => TerminalQuery
  ): SceneItemOperationsExecutor {
    const expression: QueryExpression = query(new RootQuery()).build();

    return new SceneItemOperationsExecutor(
      this.sceneViewId,
      this.commands,
      expression
    );
  }

  public all(): SceneItemOperationsExecutor {
    const allExpresion: QueryExpression = {
      type: 'all',
    };

    return new SceneItemOperationsExecutor(
      this.sceneViewId,
      this.commands,
      allExpresion
    );
  }
}
