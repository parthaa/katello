module Katello
  module Util
    module FilterClauseGenerator
      def initialize(repo, filters)
        @repo = repo
        @filters = filters
      end

      def generate
        @includes = clauses_for(:includes)
        @excludes = clauses_for(:excludes)
      end

      # This is used to generate copy clauses
      # during the "publish" of a content view definition
      # Generates clause in the following format
      # {$and => [
      #      {$or => [<includes clauses>]},
      #      {$nor => [{$or => [<excludes clauses>]}]}
      # ]}
      def copy_clause
        clauses = []
        includes = join_clauses(@includes, "$or")
        excludes = !@excludes.blank? ? {"$nor" => @excludes} : nil

        clauses << includes  if includes
        clauses << excludes  if excludes
        join_clauses(clauses, "$and")
      end

      # This is used to generate unassociation clauses
      # during the "publish" of a content view definition
      # Generates clause in the following format
      # { $or => [<excludes clauses>]}}
      def remove_clause
        join_clauses(@excludes, "$or")
      end

      protected

      def join_clauses(clauses, join_by)
        return nil if clauses.blank?
        if clauses.size > 1
          {join_by => clauses}
        elsif clauses.size == 1
          clauses.first
        end
      end

      def clauses_for(list_type)
        # fetch the applicable content type filters - fetch_filters implemented
        # by subclasses. idea is those content type  filter classes would
        # implement includes, excludes scopes.
        filters = fetch_filters.send(list_type).where(:id => @filters) # abstract
        if filters.any?
          # generate the clauses from filters to be implemented by subclasses
          clauses = collect_clauses(@repo, filters) || [] # abstract
          clauses.delete_if { |cls| cls.blank? }
          if clauses.any?
            clauses
          elsif list_type == :includes
            # includes rules were provided
            # but they generated no clause due to the fact
            # that there were no matches. So we need
            # a white list non matching mongo clause
            # something like => {"unit_id" => {"$not" => {"$exists" => true}}}
            # meaning "do not copy any unit has an id"
            # We need this to not make the "copy" happen if includess had no items to copy.
            # example scenario for this path
            # Filter  --> [Whitelist Rules-> [include "NON matching"]]

            [includes_non_matcher_clause] # abstract
          end
        elsif list_type == :includes
          # no white list rules were available for this repo
          # so we need to return an all matcher class
          # something like  => {"unit_id" => {"$exists" => true}}
          # meaning "copy any unit that has an id"
          # We need this to not make the "copy" copy everything.
          # example scenario for this path
          # Filter  -->  [Whitelist Rules-> [<none provided>], Blacklist Rule -> [remove foo]]
          #
          [includes_all_matcher_clause] # abstract
        end
      end
    end
  end
end
