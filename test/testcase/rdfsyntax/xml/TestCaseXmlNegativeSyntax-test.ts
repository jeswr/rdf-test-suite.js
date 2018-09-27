import {TestCaseXmlNegativeSyntax,
  TestCaseXmlNegativeSyntaxHandler} from "../../../../lib/testcase/rdfsyntax/xml/TestCaseXmlNegativeSyntax";
const quad = require("rdf-quad");
import {literal, namedNode} from "@rdfjs/data-model";
import "jest-rdf";
import {ContextParser} from "jsonld-context-parser";
import {Resource} from "rdf-object";
import {RdfXmlParser} from "rdfxml-streaming-parser";
import {PassThrough} from "stream";

// tslint:disable:no-var-requires
const arrayifyStream = require('arrayify-stream');
const streamifyString = require('streamify-string');

// Mock fetch
(<any> global).fetch = (url: string) => {
  let body;
  switch (url) {
  case 'ACTION.ok':
    body = streamifyString(`<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
            xmlns:dc="http://purl.org/dc/elements/1.1/"
            xmlns:ex="http://example.org/stuff/1.0/">

  <rdf:Description rdf:about="http://www.w3.org/TR/rdf-syntax-grammar"
             dc:title="RDF1.1 XML Syntax 1" />
  <rdf:Description rdf:about="http://www.w3.org/TR/rdf-syntax-grammar"
             dc:title="RDF1.1 XML Syntax 2" />

</rdf:RDF>`);
    break;
  case 'ACTION.invalid':
    body = streamifyString(`<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
            xmlns:dc="http://purl.org/dc/elements/1.1/"
            xmlns:ex="http://example.org/stuff/1.0/">
  <rdf:Description rdf:ID="abc" rdf:about="http://www.w3.org/TR/rdf-syntax-grammar" />
</rdf:RDF>`);
    break;
  default:
    return Promise.reject(new Error('Fetch error'));
    break;
  }
  return Promise.resolve(new Response(body, <any> { headers: new Headers({ a: 'b' }), status: 200, url }));
};

describe('TestCaseXmlNegativeSyntaxHandler', () => {

  const handler = new TestCaseXmlNegativeSyntaxHandler();
  const parser = {
    parse: (data: string, baseIRI: string) => Promise.resolve(arrayifyStream(streamifyString(data)
      .pipe(new RdfXmlParser({ baseIRI })))),
  };

  let context;
  let pAction;

  beforeEach((done) => {
    new ContextParser().parse(require('../../../../lib/context-manifest.json'))
      .then((parsedContext) => {
        context = parsedContext;

        pAction = new Resource(
          { term: namedNode('http://www.w3.org/2001/sw/DataAccess/tests/test-manifest#action'), context });

        done();
      });
  });

  describe('#resourceToTestCase', () => {
    it('should produce a TestCaseXmlNegativeSyntax', async () => {
      const resource = new Resource({ term: namedNode('http://ex.org/test'), context });
      resource.addProperty(pAction, new Resource({ term: literal('ACTION.ok'), context }));
      const testCase = await handler.resourceToTestCase(resource, <any> {});
      expect(testCase).toBeInstanceOf(TestCaseXmlNegativeSyntax);
      expect(testCase.type).toEqual('rdfsyntax');
      expect(testCase.data).toEqual(`<?xml version="1.0"?>
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
            xmlns:dc="http://purl.org/dc/elements/1.1/"
            xmlns:ex="http://example.org/stuff/1.0/">

  <rdf:Description rdf:about="http://www.w3.org/TR/rdf-syntax-grammar"
             dc:title="RDF1.1 XML Syntax 1" />
  <rdf:Description rdf:about="http://www.w3.org/TR/rdf-syntax-grammar"
             dc:title="RDF1.1 XML Syntax 2" />

</rdf:RDF>`);
      expect(testCase.baseIRI).toEqual('ACTION.ok');
    });

    it('should error on a resource without action', () => {
      const resource = new Resource({ term: namedNode('http://ex.org/test'), context });
      return expect(handler.resourceToTestCase(resource, <any> {})).rejects.toBeTruthy();
    });

    it('should produce TestCaseXmlNegativeSyntax that tests true on invalid data', async () => {
      const resource = new Resource({ term: namedNode('http://ex.org/test'), context });
      resource.addProperty(pAction, new Resource({ term: literal('ACTION.invalid'), context }));
      const testCase = await handler.resourceToTestCase(resource, <any> {});
      return expect(testCase.test(parser)).resolves.toBe(undefined);
    });

    it('should produce TestCaseXmlNegativeSyntax that tests false on valid data', async () => {
      const resource = new Resource({ term: namedNode('http://ex.org/test'), context });
      resource.addProperty(pAction, new Resource({ term: literal('ACTION.ok'), context }));
      const testCase = await handler.resourceToTestCase(resource, <any> {});
      return expect(testCase.test(parser)).rejects.toBeTruthy();
    });
  });

});
