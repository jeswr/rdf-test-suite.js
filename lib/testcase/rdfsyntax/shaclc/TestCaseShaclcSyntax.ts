import {Resource} from "rdf-object";
import {ITestCaseData} from "../../ITestCase";
import {TestCaseSyntax, TestCaseSyntaxHandler} from "../TestCaseSyntax";
import {TestCaseShaclcToRdfHandler} from "./TestCaseShaclcLdToRdf";
import {IFetchOptions} from "../../../Util";

export class TestCaseJsonLdSyntaxHandler extends TestCaseSyntaxHandler {

  constructor(expectNoError: boolean) {
    super(expectNoError);
  }

  public resourceToTestCase(resource: Resource, testCaseData: ITestCaseData,
                            options?: IFetchOptions): Promise<TestCaseSyntax> {
    return TestCaseShaclcToRdfHandler.wrap(super.resourceToTestCase.bind(this), resource, testCaseData, options);
  }

  protected normalizeUrl(url: string) {
    return url;
  }

}
